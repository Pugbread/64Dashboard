import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/games - List all games
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, universe_id, icon_url, created_at FROM games ORDER BY created_at DESC'
    );

    // Back-fill missing icons for games that have a universe_id
    for (const game of rows) {
      if (!game.icon_url && game.universe_id) {
        try {
          const apiUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${game.universe_id}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
          const resp = await fetch(apiUrl);
          const data: any = await resp.json();
          const url = data?.data?.[0]?.imageUrl;
          if (url) {
            await pool.query('UPDATE games SET icon_url = $1 WHERE id = $2', [url, game.id]);
            game.icon_url = url;
          }
        } catch { /* ignore */ }
      }
    }

    res.json(rows);
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games - Add a game
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, universeId, iconUrl } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Game name is required' });
      return;
    }

    // If universeId provided, try to fetch icon from Roblox
    let finalIconUrl = iconUrl || null;
    if (universeId && !finalIconUrl) {
      try {
        const apiUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
        const response = await fetch(apiUrl);
        const data: any = await response.json();
        if (data?.data?.[0]?.imageUrl) {
          finalIconUrl = data.data[0].imageUrl;
        }
      } catch {
        // Ignore icon fetch errors
      }
    }

    const { rows } = await pool.query(
      'INSERT INTO games (name, universe_id, icon_url) VALUES ($1, $2, $3) RETURNING id, name, universe_id, icon_url, created_at',
      [name, universeId || null, finalIconUrl]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/games/:id - Remove a game
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM games WHERE id = $1', [id]);

    if (rowCount === 0) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
