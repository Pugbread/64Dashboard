import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// POST /api/events/session-start - Player joined
router.post('/session-start', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId } = req.body;

    if (!gameId || !playerId) {
      res.status(400).json({ error: 'gameId and playerId are required' });
      return;
    }

    await pool.query(
      'INSERT INTO sessions (game_id, player_id, started_at) VALUES ($1, $2, NOW())',
      [gameId, playerId]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording session start:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/session-end - Player left
router.post('/session-end', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId } = req.body;

    if (!gameId || !playerId) {
      res.status(400).json({ error: 'gameId and playerId are required' });
      return;
    }

    // Close the most recent open session for this player in this game
    const { rowCount } = await pool.query(
      `UPDATE sessions 
       SET ended_at = NOW() 
       WHERE id = (
         SELECT id FROM sessions 
         WHERE game_id = $1 AND player_id = $2 AND ended_at IS NULL 
         ORDER BY started_at DESC 
         LIMIT 1
       )`,
      [gameId, playerId]
    );

    if (rowCount === 0) {
      // No open session found - create a short session anyway for data consistency
      res.status(200).json({ success: true, note: 'No open session found' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error recording session end:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/purchase - Product/gamepass bought
router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId, productType, productId, productName, priceRobux } = req.body;

    if (!gameId || !playerId || !productType || !productId || !productName) {
      res.status(400).json({
        error: 'gameId, playerId, productType, productId, and productName are required',
      });
      return;
    }

    if (!['gamepass', 'devproduct'].includes(productType)) {
      res.status(400).json({ error: 'productType must be "gamepass" or "devproduct"' });
      return;
    }

    await pool.query(
      `INSERT INTO purchases (game_id, player_id, product_type, product_id, product_name, price_robux)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameId, playerId, productType, productId, productName, priceRobux || 0]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/custom - Custom event
router.post('/custom', async (req: Request, res: Response) => {
  try {
    const { gameId, playerId, eventName, eventData } = req.body;

    if (!gameId || !playerId || !eventName) {
      res.status(400).json({ error: 'gameId, playerId, and eventName are required' });
      return;
    }

    await pool.query(
      `INSERT INTO custom_events (game_id, player_id, event_name, event_data)
       VALUES ($1, $2, $3, $4)`,
      [gameId, playerId, eventName, eventData ? JSON.stringify(eventData) : '{}']
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording custom event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
