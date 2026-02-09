import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { registry } from '../stats/registry';

const router = Router();

// GET /api/stats/providers - List available stat providers
router.get('/providers', (_req: Request, res: Response) => {
  res.json(registry.getProviderMeta());
});

// GET /api/stats/:gameId - Get stats for a game
router.get('/:gameId', async (req: Request, res: Response) => {
  try {
    const gameId = req.params.gameId as string;
    const range = String(req.query.range || '7d');
    const metricsRaw = req.query.metrics ? String(req.query.metrics) : undefined;

    // Parse time range
    const now = new Date();
    let from: Date;
    const to = now;

    switch (range) {
      case '1d':
      case 'today':
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        break;
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Default to 7 days
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Parse requested metrics (comma-separated) or use all
    const metricIds = metricsRaw
      ? metricsRaw.split(',').map((m) => m.trim())
      : undefined;

    // Verify game exists
    const { rows: gameRows } = await pool.query(
      'SELECT id FROM games WHERE id = $1',
      [gameId]
    );

    if (gameRows.length === 0) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const results = await registry.queryMultiple(pool, gameId, from, to, metricIds);

    res.json({
      gameId,
      range: range || '7d',
      from: from.toISOString(),
      to: to.toISOString(),
      metrics: results,
      providers: registry.getProviderMeta(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
