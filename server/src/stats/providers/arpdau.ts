import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult } from '../types';

export const arpdauProvider: StatProvider = {
  id: 'arpdau',
  name: 'ARPDAU',
  category: 'revenue',
  resultType: 'timeseries',
  unit: 'R$',
  format: 'currency',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<TimeSeriesResult> {
    // Revenue per day / DAU per day
    const { rows } = await pool.query(
      `SELECT 
        d.date,
        COALESCE(p.revenue, 0)::FLOAT / NULLIF(d.dau, 0) as value
      FROM (
        SELECT 
          DATE(started_at) as date,
          COUNT(DISTINCT player_id) as dau
        FROM sessions
        WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
        GROUP BY DATE(started_at)
      ) d
      LEFT JOIN (
        SELECT 
          DATE(created_at) as date,
          SUM(price_robux) as revenue
        FROM purchases
        WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
        GROUP BY DATE(created_at)
      ) p ON d.date = p.date
      ORDER BY d.date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        value: Math.round(Number(r.value || 0) * 100) / 100,
      })),
    };
  },
};
