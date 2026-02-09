import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { pool } from './db/pool';
import { adminAuth } from './middleware/adminAuth';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import eventsRoutes from './routes/events';
import statsRoutes from './routes/stats';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', adminAuth, gamesRoutes);
app.use('/api/events', apiKeyAuth, eventsRoutes);
app.use('/api/stats', adminAuth, statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static React frontend in production
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

// SPA fallback - serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Retry helper
async function retry<T>(fn: () => Promise<T>, retries: number, delayMs: number): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.log(`Attempt ${i + 1} failed: ${error.message} (code: ${error.code}), retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Unreachable');
}

// Start server
async function start() {
  const dbUrl = config.databaseUrl;
  console.log('DATABASE_URL host:', dbUrl.replace(/\/\/[^@]+@/, '//***@'));

  // Network debug
  const net = await import('net');
  const dns = await import('dns');
  const url = new URL(dbUrl);
  const testHost = url.hostname;
  const testPort = parseInt(url.port || '5432');

  // Try DNS resolution
  try {
    const addrs = await dns.promises.lookup(testHost, { all: true });
    console.log('DNS results:', JSON.stringify(addrs));
  } catch (e: any) {
    console.log('DNS lookup error:', e.message);
  }

  // Try IPv6 direct
  try {
    const ipv6Addrs = await dns.promises.resolve6(testHost).catch(() => []);
    if (ipv6Addrs.length > 0) {
      console.log(`TCP test IPv6 [${ipv6Addrs[0]}]:${testPort}...`);
      await new Promise<void>((resolve) => {
        const sock = net.connect({ host: ipv6Addrs[0], port: testPort, family: 6 }, () => {
          console.log('TCP IPv6 connect SUCCESS');
          sock.destroy();
          resolve();
        });
        sock.on('error', (e: any) => { console.log('TCP IPv6 FAILED:', e.message); resolve(); });
        sock.setTimeout(10000, () => { console.log('TCP IPv6 TIMEOUT'); sock.destroy(); resolve(); });
      });
    }
  } catch {}

  // Try IPv4
  try {
    const ipv4Addrs = await dns.promises.resolve4(testHost).catch(() => []);
    if (ipv4Addrs.length > 0) {
      console.log(`TCP test IPv4 ${ipv4Addrs[0]}:${testPort}...`);
      await new Promise<void>((resolve) => {
        const sock = net.connect({ host: ipv4Addrs[0], port: testPort, family: 4 }, () => {
          console.log('TCP IPv4 connect SUCCESS');
          sock.destroy();
          resolve();
        });
        sock.on('error', (e: any) => { console.log('TCP IPv4 FAILED:', e.message); resolve(); });
        sock.setTimeout(10000, () => { console.log('TCP IPv4 TIMEOUT'); sock.destroy(); resolve(); });
      });
    }
  } catch {}

  // Start listening immediately so healthcheck passes
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${config.port}`);
  });

  // Run migrations with retries (DB may take a moment to be ready)
  try {
    await retry(async () => {
      console.log('Attempting database connection...');
      await runMigrations(pool);
    }, 10, 5000);
    console.log('Database migrations complete');
  } catch (error: any) {
    console.error('Migration failed after retries:', error.message, error.code);
  }
}

start();
