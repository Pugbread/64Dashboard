import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const revenueProvider: StatProvider = {
  id: 'revenue',
  name: 'Revenue',
  category: 'revenue',
  unit: 'R$',
  format: 'currency',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('created_at', interval);
    const { rows } = await pool.query(
      `SELECT ${trunc} as bucket, SUM(price_robux) as value
       FROM purchases
       WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
       GROUP BY bucket ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Number(r.value || 0) })),
    };
  },
};
