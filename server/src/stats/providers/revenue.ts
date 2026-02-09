import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult } from '../types';

export const revenueProvider: StatProvider = {
  id: 'revenue',
  name: 'Revenue',
  category: 'revenue',
  resultType: 'timeseries',
  unit: 'R$',
  format: 'currency',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<TimeSeriesResult> {
    const { rows } = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        SUM(price_robux) as value
      FROM purchases
      WHERE game_id = $1 AND created_at >= $2 AND created_at < $3
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        value: Number(r.value || 0),
      })),
    };
  },
};
