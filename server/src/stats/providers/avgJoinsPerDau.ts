import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult } from '../types';

export const avgJoinsPerDauProvider: StatProvider = {
  id: 'avg_joins_per_dau',
  name: 'Avg Joins per DAU',
  category: 'engagement',
  resultType: 'timeseries',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<TimeSeriesResult> {
    // Total sessions per day divided by unique players per day
    const { rows } = await pool.query(
      `SELECT 
        DATE(started_at) as date,
        COUNT(*)::FLOAT / NULLIF(COUNT(DISTINCT player_id), 0) as value
      FROM sessions
      WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
      GROUP BY DATE(started_at)
      ORDER BY date ASC`,
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
