import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

/**
 * Fetch game icons from Roblox Thumbnails API in a single batched call.
 * Returns a map of universeId -> imageUrl.
 */
async function fetchGameIcons(universeIds: string[]): Promise<Record<string, string>> {
  if (universeIds.length === 0) return {};
  try {
    const apiUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
    const resp = await fetch(apiUrl);
    const data: any = await resp.json();
    const map: Record<string, string> = {};
    if (Array.isArray(data?.data)) {
      for (const item of data.data) {
        if (item.imageUrl) {
          map[String(item.targetId)] = item.imageUrl;
        }
      }
    }
    return map;
  } catch {
    return {};
  }
}

// GET /api/games - List all games
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, universe_id, icon_url, created_at FROM games ORDER BY created_at DESC'
    );

    // Back-fill missing icons in a single batched call
    const needsIcon = rows.filter((g) => !g.icon_url && g.universe_id);
    if (needsIcon.length > 0) {
      const iconMap = await fetchGameIcons(needsIcon.map((g) => g.universe_id));
      const updates: Promise<any>[] = [];
      for (const game of needsIcon) {
        const url = iconMap[game.universe_id];
        if (url) {
          game.icon_url = url;
          updates.push(pool.query('UPDATE games SET icon_url = $1 WHERE id = $2', [url, game.id]));
        }
      }
      await Promise.all(updates);
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
      const iconMap = await fetchGameIcons([universeId]);
      finalIconUrl = iconMap[universeId] || null;
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
