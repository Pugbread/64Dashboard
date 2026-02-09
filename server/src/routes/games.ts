import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/games - List all games
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, icon_url, created_at FROM games ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games - Add a game
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, iconUrl } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Game name is required' });
      return;
    }

    const { rows } = await pool.query(
      'INSERT INTO games (name, icon_url) VALUES ($1, $2) RETURNING id, name, icon_url, created_at',
      [name, iconUrl || null]
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
