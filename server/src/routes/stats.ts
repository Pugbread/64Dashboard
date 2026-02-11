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

// GET /api/stats/:gameId/product-breakdown — revenue & sales per product (paginated)
router.get('/:gameId/product-breakdown', async (req: Request, res: Response) => {
  try {
    const gameId = String(req.params.gameId);
    const rangeRaw = String(req.query.range || '7d');
    const range: Range = VALID_RANGES.includes(rangeRaw as Range) ? (rangeRaw as Range) : '7d';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(25, Math.max(1, parseInt(String(req.query.limit || '25'), 10) || 25));
    const offset = (page - 1) * limit;

    const to = new Date();
    const from = new Date(to.getTime() - RANGE_MS[range]);

    // Verify game
    const { rows: gameRows } = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameRows.length === 0) { res.status(404).json({ error: 'Game not found' }); return; }

    // Count total distinct products
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT product_id FROM purchases
         WHERE game_id = $1 AND created_at >= $2 AND created_at <= $3
         GROUP BY product_id
       ) sub`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    const total = parseInt(countRows[0]?.total || '0', 10);

    // Query paginated purchases grouped by product
    const { rows } = await pool.query(
      `SELECT product_id, product_name, product_type,
              SUM(price_robux)::int AS revenue,
              COUNT(*)::int AS sales
       FROM purchases
       WHERE game_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY product_id, product_name, product_type
       ORDER BY revenue DESC
       LIMIT $4 OFFSET $5`,
      [gameId, from.toISOString(), to.toISOString(), limit, offset]
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

    res.json({ products, total, page, limit, totalPages: Math.ceil(total / limit), range, from: from.toISOString(), to: to.toISOString() });
  } catch (error) {
    console.error('Product breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/:gameId/top-spenders — top spenders by robux spent (paginated)
router.get('/:gameId/top-spenders', async (req: Request, res: Response) => {
  try {
    const gameId = String(req.params.gameId);
    const rangeRaw = String(req.query.range || '7d');
    const range: Range = VALID_RANGES.includes(rangeRaw as Range) ? (rangeRaw as Range) : '7d';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(25, Math.max(1, parseInt(String(req.query.limit || '25'), 10) || 25));
    const offset = (page - 1) * limit;

    const to = new Date();
    const from = new Date(to.getTime() - RANGE_MS[range]);

    // Verify game
    const { rows: gameRows } = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameRows.length === 0) { res.status(404).json({ error: 'Game not found' }); return; }

    // Count total distinct spenders
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT player_id FROM purchases
         WHERE game_id = $1 AND created_at >= $2 AND created_at <= $3
         GROUP BY player_id
       ) sub`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    const total = parseInt(countRows[0]?.total || '0', 10);

    // Query paginated purchases grouped by player
    const { rows } = await pool.query(
      `SELECT player_id,
              SUM(price_robux)::int AS spent,
              COUNT(*)::int AS purchases
       FROM purchases
       WHERE game_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY player_id
       ORDER BY spent DESC
       LIMIT $4 OFFSET $5`,
      [gameId, from.toISOString(), to.toISOString(), limit, offset]
    );

    if (rows.length === 0) {
      res.json({ spenders: [], total, page, limit, totalPages: Math.ceil(total / limit), range, from: from.toISOString(), to: to.toISOString() });
      return;
    }

    // Resolve usernames and avatars from Roblox
    const playerIds = rows.map((r) => r.player_id);
    const usernameMap: Record<string, string> = {};
    const avatarMap: Record<string, string | null> = {};

    // Fetch usernames via POST /v1/users
    try {
      const userRes = await fetch('https://users.roblox.com/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: playerIds.map(Number), excludeBannedUsers: false }),
      });
      const userData: any = await userRes.json();
      if (Array.isArray(userData?.data)) {
        for (const u of userData.data) {
          usernameMap[String(u.id)] = u.displayName || u.name || String(u.id);
        }
      }
    } catch { /* ignore */ }

    // Fetch avatar headshots
    try {
      const avatarRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${playerIds.join(',')}&size=150x150&format=Png&isCircular=false`
      );
      const avatarData: any = await avatarRes.json();
      if (Array.isArray(avatarData?.data)) {
        for (const a of avatarData.data) {
          avatarMap[String(a.targetId)] = a.imageUrl || null;
        }
      }
    } catch { /* ignore */ }

    const spenders = rows.map((r) => ({
      playerId: r.player_id,
      displayName: usernameMap[r.player_id] || r.player_id,
      avatarUrl: avatarMap[r.player_id] || null,
      spent: r.spent,
      purchases: r.purchases,
    }));

    res.json({ spenders, total, page, limit, totalPages: Math.ceil(total / limit), range, from: from.toISOString(), to: to.toISOString() });
  } catch (error) {
    console.error('Top spenders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Roblox user resolution helper (batch, with cache) ──

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function resolvePlayersToCache(playerIds: string[]): Promise<void> {
  if (playerIds.length === 0) return;

  // Check which ones are stale or missing
  const { rows: cached } = await pool.query(
    `SELECT player_id, updated_at FROM player_cache WHERE player_id = ANY($1)`,
    [playerIds]
  );
  const cachedMap = new Map(cached.map((r) => [r.player_id, new Date(r.updated_at).getTime()]));
  const now = Date.now();
  const needsResolve = playerIds.filter((id) => {
    const ts = cachedMap.get(id);
    return !ts || (now - ts > CACHE_TTL_MS);
  });

  if (needsResolve.length === 0) return;

  // Batch in groups of 100 (Roblox API limit)
  for (let i = 0; i < needsResolve.length; i += 100) {
    const batch = needsResolve.slice(i, i + 100);
    try {
      // Fetch user info
      const userRes = await fetch('https://users.roblox.com/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: batch.map(Number), excludeBannedUsers: false }),
      });
      const userData: any = await userRes.json();

      // Fetch avatar headshots
      const avatarRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${batch.join(',')}&size=150x150&format=Png&isCircular=false`
      );
      const avatarData: any = await avatarRes.json();
      const avatarMap: Record<string, string | null> = {};
      if (Array.isArray(avatarData?.data)) {
        for (const a of avatarData.data) {
          avatarMap[String(a.targetId)] = a.imageUrl || null;
        }
      }

      if (Array.isArray(userData?.data)) {
        for (const u of userData.data) {
          const pid = String(u.id);
          await pool.query(
            `INSERT INTO player_cache (player_id, display_name, username, avatar_url, has_verified_badge, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (player_id) DO UPDATE SET
               display_name = EXCLUDED.display_name,
               username = EXCLUDED.username,
               avatar_url = EXCLUDED.avatar_url,
               has_verified_badge = EXCLUDED.has_verified_badge,
               updated_at = NOW()`,
            [pid, u.displayName || u.name || pid, u.name || pid, avatarMap[pid] || null, !!u.hasVerifiedBadge]
          );
        }
      }
    } catch (e) {
      console.error('Roblox user resolve batch error:', e);
    }
  }
}

// GET /api/stats/:gameId/users — paginated player list with playtime
router.get('/:gameId/users', async (req: Request, res: Response) => {
  try {
    const gameId = String(req.params.gameId);
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(25, Math.max(1, parseInt(String(req.query.limit || '25'), 10) || 25));
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const verifiedOnly = req.query.verified === 'true';
    const sortBy = String(req.query.sort || 'playtime');

    // Verify game
    const { rows: gameRows } = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameRows.length === 0) { res.status(404).json({ error: 'Game not found' }); return; }

    // Build query — join sessions with cache (LEFT JOIN so uncached players still appear)
    const conditions: string[] = ['s.game_id = $1'];
    const params: any[] = [gameId];
    let paramIdx = 2;

    if (search) {
      conditions.push(`(pc.display_name ILIKE $${paramIdx} OR pc.username ILIKE $${paramIdx} OR s.player_id = $${paramIdx + 1})`);
      params.push(`%${search}%`, search);
      paramIdx += 2;
    }
    if (verifiedOnly) {
      conditions.push(`pc.has_verified_badge = TRUE`);
    }

    const whereClause = conditions.join(' AND ');

    let orderClause: string;
    switch (sortBy) {
      case 'name': orderClause = 'COALESCE(pc.display_name, s.player_id) ASC'; break;
      case 'joins': orderClause = 'joins DESC'; break;
      default: orderClause = 'playtime_seconds DESC'; break;
    }

    // Count total
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT s.player_id FROM sessions s
         LEFT JOIN player_cache pc ON pc.player_id = s.player_id
         WHERE ${whereClause}
         GROUP BY s.player_id, pc.display_name, pc.username, pc.has_verified_badge
       ) sub`,
      params
    );
    const total = parseInt(countRows[0]?.total || '0', 10);

    // Fetch paginated page (fast — no Roblox calls yet)
    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT
         s.player_id,
         COALESCE(pc.display_name, s.player_id) AS display_name,
         pc.username,
         pc.avatar_url,
         COALESCE(pc.has_verified_badge, FALSE) AS has_verified_badge,
         COUNT(*)::int AS joins,
         COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(s.ended_at, NOW()) - s.started_at)))::bigint, 0) AS playtime_seconds,
         MAX(s.started_at) AS last_seen
       FROM sessions s
       LEFT JOIN player_cache pc ON pc.player_id = s.player_id
       WHERE ${whereClause}
       GROUP BY s.player_id, pc.display_name, pc.username, pc.avatar_url, pc.has_verified_badge
       ORDER BY ${orderClause}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    // Resolve ONLY this page's uncached/stale players (max 25)
    const pagePlayerIds = rows.map((r) => r.player_id);
    const uncached = rows.filter((r) => !r.username).map((r) => r.player_id);
    if (uncached.length > 0) {
      await resolvePlayersToCache(uncached);
      // Re-read only the resolved rows from cache
      const { rows: freshCache } = await pool.query(
        `SELECT player_id, display_name, username, avatar_url, has_verified_badge FROM player_cache WHERE player_id = ANY($1)`,
        [uncached]
      );
      const cacheMap = new Map(freshCache.map((r) => [r.player_id, r]));
      for (const row of rows) {
        const c = cacheMap.get(row.player_id);
        if (c) {
          row.display_name = c.display_name || row.display_name;
          row.username = c.username;
          row.avatar_url = c.avatar_url;
          row.has_verified_badge = c.has_verified_badge;
        }
      }
    }

    // Fire-and-forget: background-cache remaining uncached players for this game
    // This makes subsequent loads (including verified filter / search) progressively better
    (async () => {
      try {
        const { rows: uncachedAll } = await pool.query(
          `SELECT DISTINCT s.player_id FROM sessions s
           LEFT JOIN player_cache pc ON pc.player_id = s.player_id
           WHERE s.game_id = $1 AND pc.player_id IS NULL
           LIMIT 200`,
          [gameId]
        );
        if (uncachedAll.length > 0) {
          await resolvePlayersToCache(uncachedAll.map((r) => r.player_id));
        }
      } catch { /* background, ignore errors */ }
    })();

    const users = rows.map((r) => ({
      playerId: r.player_id,
      displayName: r.display_name,
      username: r.username || r.player_id,
      avatarUrl: r.avatar_url || null,
      hasVerifiedBadge: r.has_verified_badge,
      joins: r.joins,
      playtimeSeconds: parseInt(r.playtime_seconds, 10),
      lastSeen: r.last_seen,
    }));

    res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Users list error:', error);
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
    const allProviders = registry.getProviderMeta(category);
    if (allProviders.length === 0) { res.status(404).json({ error: 'Unknown category' }); return; }

    // Optional: filter to a single provider for progressive loading
    const providerFilter = req.query.provider ? String(req.query.provider) : undefined;

    if (providerFilter) {
      const providerMeta = allProviders.find((p) => p.id === providerFilter);
      if (!providerMeta) { res.status(404).json({ error: 'Unknown provider' }); return; }
      const result = await registry.querySingleProvider(pool, gameId, providerFilter, from, to, interval);
      res.json({
        gameId, category, range, interval,
        from: from.toISOString(),
        to: to.toISOString(),
        providers: [providerMeta],
        metrics: { [providerFilter]: result },
      });
    } else {
      const metrics = await registry.queryCategory(pool, gameId, category, from, to, interval);
      res.json({
        gameId, category, range, interval,
        from: from.toISOString(),
        to: to.toISOString(),
        providers: allProviders,
        metrics,
      });
    }
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
