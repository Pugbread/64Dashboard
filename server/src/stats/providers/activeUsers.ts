import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate } from '../types';

export const activeUsersProvider: StatProvider = {
  id: 'active_users',
  name: 'Active Users',
  category: 'engagement',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const { rows } = await pool.query(
      `SELECT ${trunc} as bucket, COUNT(DISTINCT player_id) as value
       FROM sessions
       WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
       GROUP BY bucket ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Number(r.value) })),
    };
  },
};
