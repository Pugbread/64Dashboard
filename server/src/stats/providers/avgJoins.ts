import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const avgJoinsProvider: StatProvider = {
  id: 'avg_joins',
  name: 'Avg Joins per User',
  category: 'engagement',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const { rows } = await pool.query(
      `SELECT ${trunc} as bucket,
              COUNT(*)::FLOAT / NULLIF(COUNT(DISTINCT player_id), 0) as value
       FROM sessions
       WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
       GROUP BY bucket ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Math.round(Number(r.value || 0) * 100) / 100 })),
    };
  },
};
