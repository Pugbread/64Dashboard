import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const dauProvider: StatProvider = {
  id: 'dau',
  name: 'Daily Active Users',
  category: 'engagement',
  resultType: 'timeseries',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval = 'daily'): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const { rows } = await pool.query(
      `SELECT 
        ${trunc} as date,
        COUNT(DISTINCT player_id) as value
      FROM sessions
      WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
      GROUP BY ${trunc}
      ORDER BY date ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.date, interval), value: Number(r.value) })),
    };
  },
};
