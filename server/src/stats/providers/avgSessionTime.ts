import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const avgSessionTimeProvider: StatProvider = {
  id: 'avg_session_time',
  name: 'Avg Session Time',
  category: 'engagement',
  resultType: 'timeseries',
  unit: 'min',
  format: 'duration',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval = 'daily'): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const { rows } = await pool.query(
      `SELECT 
        ${trunc} as date,
        AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at)) / 60.0) as value
      FROM sessions
      WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
      GROUP BY ${trunc}
      ORDER BY date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: formatRowDate(r.date, interval),
        value: Math.round(Number(r.value) * 100) / 100,
      })),
    };
  },
};
