import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const conversionRateProvider: StatProvider = {
  id: 'conversion_rate',
  name: 'Conversion Rate',
  category: 'revenue',
  unit: '%',
  format: 'percentage',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const truncSession = intervalTrunc('started_at', interval);
    const truncPurchase = intervalTrunc('created_at', interval);
    const { rows } = await pool.query(
      `SELECT d.bucket,
              ROUND(COALESCE(p.payers, 0)::NUMERIC / NULLIF(d.users, 0) * 100, 2) AS value
       FROM (
         SELECT ${truncSession} AS bucket, COUNT(DISTINCT player_id) AS users
         FROM sessions
         WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
         GROUP BY bucket
       ) d
       LEFT JOIN (
         SELECT ${truncPurchase} AS bucket, COUNT(DISTINCT player_id) AS payers
         FROM purchases
         WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
         GROUP BY bucket
       ) p ON d.bucket = p.bucket
       ORDER BY d.bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Number(r.value || 0) })),
    };
  },
};
