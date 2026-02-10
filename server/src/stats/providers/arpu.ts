import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const arpuProvider: StatProvider = {
  id: 'arpu',
  name: 'ARPU',
  category: 'revenue',
  unit: 'R$',
  format: 'currency',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const truncPurchase = intervalTrunc('created_at', interval);
    const { rows } = await pool.query(
      `SELECT d.bucket, COALESCE(p.revenue, 0)::FLOAT / NULLIF(d.users, 0) as value
       FROM (
         SELECT ${trunc} as bucket, COUNT(DISTINCT player_id) as users
         FROM sessions
         WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
         GROUP BY bucket
       ) d
       LEFT JOIN (
         SELECT ${truncPurchase} as bucket, SUM(price_robux) as revenue
         FROM purchases
         WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
         GROUP BY bucket
       ) p ON d.bucket = p.bucket
       ORDER BY d.bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Math.round(Number(r.value || 0) * 100) / 100 })),
    };
  },
};
