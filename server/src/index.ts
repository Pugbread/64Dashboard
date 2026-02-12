import http from 'http';
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
import proxyRoutes from './routes/proxy';
import { setupWebSocket } from './ws';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', adminAuth, gamesRoutes);
app.use('/api/events', apiKeyAuth, eventsRoutes);
app.use('/api/stats', adminAuth, statsRoutes);
app.use('/api/proxy', adminAuth, proxyRoutes);

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
      console.log(`DB connect attempt ${i + 1} failed: ${error.message}, retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Unreachable');
}

// Start server
async function start() {
  // Attach WebSocket server
  setupWebSocket(server);

  // Start listening immediately so healthcheck passes
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${config.port}`);
  });

  // Run migrations with retries (DB may take a moment to be ready)
  try {
    await retry(() => runMigrations(pool), 10, 5000);
    console.log('Database migrations complete');
  } catch (error: any) {
    console.error('Migration failed after retries:', error.message);
  }
}

start();
