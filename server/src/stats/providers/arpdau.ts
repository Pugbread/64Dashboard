import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const arpdauProvider: StatProvider = {
  id: 'arpdau',
  name: 'ARPDAU',
  category: 'revenue',
  resultType: 'timeseries',
  unit: 'R$',
  format: 'currency',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval = 'daily'): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const truncPurchase = intervalTrunc('created_at', interval);

    const { rows } = await pool.query(
      `SELECT 
        d.date,
        COALESCE(p.revenue, 0)::FLOAT / NULLIF(d.dau, 0) as value
      FROM (
        SELECT 
          ${trunc} as date,
          COUNT(DISTINCT player_id) as dau
        FROM sessions
        WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
        GROUP BY ${trunc}
      ) d
      LEFT JOIN (
        SELECT 
          ${truncPurchase} as date,
          SUM(price_robux) as revenue
        FROM purchases
        WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
        GROUP BY ${truncPurchase}
      ) p ON d.date = p.date
      ORDER BY d.date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: formatRowDate(r.date, interval),
        value: Math.round(Number(r.value || 0) * 100) / 100,
      })),
    };
  },
};
