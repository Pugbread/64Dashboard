import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { registry } from '../stats/registry';
import {
  Range, Interval, RANGE_MS,
  INTERVAL_AVAILABILITY, DEFAULT_INTERVAL,
} from '../stats/types';

const router = Router();

const VALID_RANGES: Range[] = ['1h', '6h', '24h', '3d', '7d', '30d'];
const VALID_INTERVALS: Interval[] = ['1m', '5m', '30m', '1h', '3h', '7h', '1d'];

// GET /api/stats/meta — categories, providers, interval rules
router.get('/meta', (_req: Request, res: Response) => {
  res.json({
    categories: registry.getCategories(),
    providers: registry.getProviderMeta(),
    ranges: VALID_RANGES,
    intervals: VALID_INTERVALS,
    intervalAvailability: INTERVAL_AVAILABILITY,
    defaultIntervals: DEFAULT_INTERVAL,
  });
});

// GET /api/stats/:gameId/ccu — live player count from Roblox API
router.get('/:gameId/ccu', async (req: Request, res: Response) => {
  try {
    const gameId = String(req.params.gameId);

    // Look up universe_id for this game
    const { rows } = await pool.query(
      'SELECT universe_id FROM games WHERE id = $1',
      [gameId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const universeId = rows[0].universe_id;
    if (!universeId) {
      // No universe_id linked — can't poll Roblox
      res.json({ ccu: 0, source: 'none' });
      return;
    }

    // Fetch live player count from Roblox Games API
    const robloxRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`
    );
    const data: any = await robloxRes.json();
    const playing = data?.data?.[0]?.playing ?? 0;

    res.json({ ccu: playing, source: 'roblox' });
  } catch (error) {
    console.error('CCU error:', error);
    res.json({ ccu: 0, source: 'error' });
  }
});

// GET /api/stats/:gameId/product-breakdown — revenue & sales per product
router.get('/:gameId/product-breakdown', async (req: Request, res: Response) => {
  try {
    const gameId = String(req.params.gameId);
    const rangeRaw = String(req.query.range || '7d');
    const range: Range = VALID_RANGES.includes(rangeRaw as Range) ? (rangeRaw as Range) : '7d';

    const to = new Date();
    const from = new Date(to.getTime() - RANGE_MS[range]);

    // Verify game
    const { rows: gameRows } = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameRows.length === 0) { res.status(404).json({ error: 'Game not found' }); return; }

    // Query purchases grouped by product
    const { rows } = await pool.query(
      `SELECT product_id, product_name, product_type,
              SUM(price_robux)::int AS revenue,
              COUNT(*)::int AS sales
       FROM purchases
       WHERE game_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY product_id, product_name, product_type
       ORDER BY revenue DESC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    // Resolve product icons via Roblox Thumbnails API
    const devIds = rows.filter((r) => r.product_type === 'devproduct').map((r) => r.product_id);
    const passIds = rows.filter((r) => r.product_type === 'gamepass').map((r) => r.product_id);
    const iconMap: Record<string, string | null> = {};

    const fetchIcons = async (ids: string[], type: string) => {
      if (ids.length === 0) return;
      try {
        const url = type === 'gamepass'
          ? `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${ids.join(',')}&size=150x150&format=Png&isCircular=false`
          : `https://thumbnails.roblox.com/v1/developer-products/icons?developerProductIds=${ids.join(',')}&size=150x150&format=Png&isCircular=false`;
        const resp = await fetch(url);
        const data: any = await resp.json();
        if (Array.isArray(data?.data)) {
          for (const item of data.data) {
            iconMap[String(item.targetId)] = item.imageUrl || null;
          }
        }
      } catch { /* ignore icon fetch failures */ }
    };

    await Promise.all([
      fetchIcons(devIds, 'devproduct'),
      fetchIcons(passIds, 'gamepass'),
    ]);

    const products = rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      productType: r.product_type,
      revenue: r.revenue,
      sales: r.sales,
      iconUrl: iconMap[r.product_id] || null,
    }));

    res.json({ products, range, from: from.toISOString(), to: to.toISOString() });
  } catch (error) {
    console.error('Product breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/:gameId/:category — stats for one category
router.get('/:gameId/:category', async (req: Request, res: Response) => {
  try {
    const gameId = String(req.params.gameId);
    const category = String(req.params.category);
    const rangeRaw = String(req.query.range || '7d');
    const range: Range = VALID_RANGES.includes(rangeRaw as Range) ? (rangeRaw as Range) : '7d';

    // Resolve interval (validate against availability)
    let intervalRaw = req.query.interval ? String(req.query.interval) : undefined;
    const available = INTERVAL_AVAILABILITY[range];
    let interval: Interval;
    if (intervalRaw && VALID_INTERVALS.includes(intervalRaw as Interval) && available.includes(intervalRaw as Interval)) {
      interval = intervalRaw as Interval;
    } else {
      interval = DEFAULT_INTERVAL[range];
    }

    // Compute time window
    const to = new Date();
    const from = new Date(to.getTime() - RANGE_MS[range]);

    // Verify game
    const { rows: gameRows } = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameRows.length === 0) { res.status(404).json({ error: 'Game not found' }); return; }

    // Verify category
    const providers = registry.getProviderMeta(category);
    if (providers.length === 0) { res.status(404).json({ error: 'Unknown category' }); return; }

    const metrics = await registry.queryCategory(pool, gameId, category, from, to, interval);

    res.json({
      gameId, category, range, interval,
      from: from.toISOString(),
      to: to.toISOString(),
      providers,
      metrics,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
