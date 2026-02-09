import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult } from '../types';

export const avgPlaytimePerDauProvider: StatProvider = {
  id: 'avg_playtime_per_dau',
  name: 'Avg Playtime per DAU',
  category: 'engagement',
  resultType: 'timeseries',
  unit: 'min',
  format: 'duration',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<TimeSeriesResult> {
    // Total playtime per day divided by unique players per day
    const { rows } = await pool.query(
      `SELECT 
        DATE(started_at) as date,
        SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at)) / 60.0) / 
          NULLIF(COUNT(DISTINCT player_id), 0) as value
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
