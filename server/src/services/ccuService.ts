import { Pool } from 'pg';

const HISTORY_KEEP_DAYS = 7;

export async function sampleGameCcu(pool: Pool, gameId: string, universeId: string): Promise<number | null> {
  try {
    const robloxRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
    const data: any = await robloxRes.json();
    const playing = Number(data?.data?.[0]?.playing ?? 0);

    await pool.query('INSERT INTO ccu_history (game_id, ccu) VALUES ($1, $2)', [gameId, playing]);
    await pool.query(
      `DELETE FROM ccu_history
       WHERE game_id = $1
         AND sampled_at < NOW() - ($2::text || ' days')::interval`,
      [gameId, String(HISTORY_KEEP_DAYS)]
    );
    await pool.query(
      `UPDATE games
       SET ccu_all_time_high = GREATEST(COALESCE(ccu_all_time_high, 0), $2),
           ccu_all_time_high_at = CASE
             WHEN $2 > COALESCE(ccu_all_time_high, 0) THEN NOW()
             ELSE ccu_all_time_high_at
           END
       WHERE id = $1`,
      [gameId, playing]
    );

    return playing;
  } catch (error) {
    console.error(`CCU sample failed for game ${gameId}:`, error);
    return null;
  }
}

export async function getCcuSnapshot(pool: Pool, gameId: string) {
  // Last 3h, bucketed by minute (max CCU in each minute bucket).
  const { rows: histRows } = await pool.query(
    `WITH minute_buckets AS (
       SELECT date_trunc('minute', sampled_at) AS minute_bucket,
              MAX(ccu)::int AS ccu
       FROM ccu_history
       WHERE game_id = $1
         AND sampled_at >= NOW() - INTERVAL '3 hours'
       GROUP BY minute_bucket
     )
     SELECT ccu
     FROM minute_buckets
     ORDER BY minute_bucket DESC
     LIMIT 180`,
    [gameId]
  );
  const history = histRows.map((r) => Number(r.ccu || 0)).reverse();

  const { rows: latestRows } = await pool.query(
    `SELECT ccu
     FROM ccu_history
     WHERE game_id = $1
     ORDER BY sampled_at DESC
     LIMIT 1`,
    [gameId]
  );
  const latest = Number(latestRows[0]?.ccu || history[history.length - 1] || 0);

  const { rows: gameRows } = await pool.query(
    `SELECT ccu_all_time_high, ccu_all_time_high_at
     FROM games
     WHERE id = $1`,
    [gameId]
  );
  const allTimeHigh = Number(gameRows[0]?.ccu_all_time_high || 0);
  const allTimeHighAt = gameRows[0]?.ccu_all_time_high_at
    ? new Date(gameRows[0].ccu_all_time_high_at).toISOString()
    : null;

  return { latest, history, allTimeHigh, allTimeHighAt };
}

export async function pollAllGamesCcu(pool: Pool): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, universe_id
     FROM games
     WHERE universe_id IS NOT NULL AND universe_id <> ''`
  );
  await Promise.all(
    rows.map((row) => sampleGameCcu(pool, String(row.id), String(row.universe_id)))
  );
}
