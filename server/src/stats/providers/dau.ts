import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult } from '../types';

export const dauProvider: StatProvider = {
  id: 'dau',
  name: 'Daily Active Users',
  category: 'engagement',
  resultType: 'timeseries',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<TimeSeriesResult> {
    const { rows } = await pool.query(
      `SELECT 
        DATE(started_at) as date,
        COUNT(DISTINCT player_id) as value
      FROM sessions
      WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
      GROUP BY DATE(started_at)
      ORDER BY date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: r.date.toISOString().split('T')[0], value: Number(r.value) })),
    };
  },
};
