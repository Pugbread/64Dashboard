import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, formatRowDate } from '../types';

export const activeUsersAccumulatedProvider: StatProvider = {
  id: 'active_users_accumulated',
  name: 'Accumulated Active Users',
  category: 'engagement',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const pgInterval: Record<Interval, string> = {
      '1m': '1 minute',
      '5m': '5 minutes',
      '30m': '30 minutes',
      '1h': '1 hour',
      '3h': '3 hours',
      '7h': '7 hours',
      '1d': '1 day',
    };

    const { rows } = await pool.query(
      `WITH first_seen AS (
         SELECT player_id, MIN(started_at) AS first_seen
         FROM sessions
         WHERE game_id = $1 AND started_at >= $2 AND started_at < $3
         GROUP BY player_id
       ),
       buckets AS (
         SELECT generate_series($2::timestamptz, $3::timestamptz, $4::interval) AS bucket
       )
       SELECT b.bucket,
              COUNT(fs.player_id)::int AS value
       FROM buckets b
       LEFT JOIN first_seen fs
         ON fs.first_seen <= b.bucket
       GROUP BY b.bucket
       ORDER BY b.bucket ASC`,
      [gameId, from.toISOString(), to.toISOString(), pgInterval[interval]]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: formatRowDate(r.bucket, interval),
        value: Number(r.value || 0),
      })),
    };
  },
};
