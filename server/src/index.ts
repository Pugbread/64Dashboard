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

// Start server
async function start() {
  try {
    // Run database migrations
    await runMigrations(pool);
    console.log('Database migrations complete');
  } catch (error) {
    console.error('Migration error (non-fatal, will retry on next request):', error);
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${config.port}`);
    console.log(`Dashboard: http://localhost:${config.port}`);
  });
}

start();
