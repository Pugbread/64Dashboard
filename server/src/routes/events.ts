import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { broadcastPurchase } from '../ws';

const router = Router();

/**
 * In-memory cache: universe_id / raw id -> internal UUID.
 * Avoids a DB lookup on every single event from game servers.
 * TTL: entries expire after 5 minutes.
 */
const idCache = new Map<string, { uuid: string; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Resolve a gameId to the internal UUID.
 * Accepts either:
 *   - The dashboard UUID directly  (e.g. "a1b2c3d4-...")
 *   - A Roblox universe ID         (e.g. "1234567890")
 * Returns the internal UUID or null.
 */
async function resolveGameId(gameId: string): Promise<string | null> {
  // Check cache first
  const cached = idCache.get(gameId);
  if (cached && cached.expires > Date.now()) return cached.uuid;

  // Try direct UUID match
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(gameId)) {
    const { rows } = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (rows.length > 0) {
      idCache.set(gameId, { uuid: rows[0].id, expires: Date.now() + CACHE_TTL });
      return rows[0].id;
    }
  }

  // Try universe_id lookup (Roblox universe ID)
  const { rows } = await pool.query('SELECT id FROM games WHERE universe_id = $1', [gameId]);
  if (rows.length > 0) {
    idCache.set(gameId, { uuid: rows[0].id, expires: Date.now() + CACHE_TTL });
    return rows[0].id;
  }

  return null;
}

// POST /api/events/session-start
router.post('/session-start', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId } = req.body;
    if (!gameId || !playerId) {
      res.status(400).json({ error: 'gameId and playerId are required' });
      return;
    }

    const resolvedId = await resolveGameId(String(gameId));
    if (!resolvedId) {
      res.status(404).json({ error: 'Game not found. Use the dashboard UUID or the Roblox universe ID.' });
      return;
    }

    await pool.query(
      'INSERT INTO sessions (game_id, player_id, started_at) VALUES ($1, $2, NOW())',
      [resolvedId, String(playerId)]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording session start:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/session-end
router.post('/session-end', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId } = req.body;
    if (!gameId || !playerId) {
      res.status(400).json({ error: 'gameId and playerId are required' });
      return;
    }

    const resolvedId = await resolveGameId(String(gameId));
    if (!resolvedId) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const { rowCount } = await pool.query(
      `UPDATE sessions 
       SET ended_at = NOW() 
       WHERE id = (
         SELECT id FROM sessions 
         WHERE game_id = $1 AND player_id = $2 AND ended_at IS NULL 
         ORDER BY started_at DESC 
         LIMIT 1
       )`,
      [resolvedId, String(playerId)]
    );

    if (rowCount === 0) {
      res.status(200).json({ success: true, note: 'No open session found' });
      return;
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error recording session end:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/purchase
router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId, productType, productId, productName, priceRobux } = req.body;
    if (!gameId || !playerId || !productType || !productId || !productName) {
      res.status(400).json({ error: 'gameId, playerId, productType, productId, and productName are required' });
      return;
    }
    if (!['gamepass', 'devproduct'].includes(productType)) {
      res.status(400).json({ error: 'productType must be "gamepass" or "devproduct"' });
      return;
    }

    const resolvedId = await resolveGameId(String(gameId));
    if (!resolvedId) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    await pool.query(
      `INSERT INTO purchases (game_id, player_id, product_type, product_id, product_name, price_robux)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [resolvedId, String(playerId), productType, productId, productName, priceRobux || 0]
    );

    // Broadcast to live feed via WebSocket
    broadcastPurchase({
      gameId: resolvedId,
      playerId: String(playerId),
      productId: String(productId),
      productName: String(productName),
      productType: String(productType),
      priceRobux: priceRobux || 0,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/custom
router.post('/custom', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId, eventName, eventData } = req.body;
    if (!gameId || !playerId || !eventName) {
      res.status(400).json({ error: 'gameId, playerId, and eventName are required' });
      return;
    }

    const resolvedId = await resolveGameId(String(gameId));
    if (!resolvedId) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    await pool.query(
      `INSERT INTO custom_events (game_id, player_id, event_name, event_data)
       VALUES ($1, $2, $3, $4)`,
      [resolvedId, String(playerId), eventName, eventData ? JSON.stringify(eventData) : '{}']
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording custom event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
