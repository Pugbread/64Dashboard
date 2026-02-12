import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const arppuProvider: StatProvider = {
  id: 'arppu',
  name: 'ARPPU',
  category: 'revenue',
  unit: 'R$',
  format: 'currency',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('created_at', interval);
    const { rows } = await pool.query(
      `SELECT bucket,
              CASE WHEN payers > 0 THEN ROUND((revenue::NUMERIC / payers), 2) ELSE 0 END AS value
       FROM (
         SELECT ${trunc} AS bucket,
                COUNT(DISTINCT player_id) AS payers,
                SUM(price_robux) AS revenue
         FROM purchases
         WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
         GROUP BY bucket
       ) sub
       ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Number(r.value || 0) })),
    };
  },
};
