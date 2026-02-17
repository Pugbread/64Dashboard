import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, TimeSeriesPoint, Interval, intervalTrunc, formatRowDate, INTERVAL_SECONDS } from '../types';

export const avgSessionTimeProvider: StatProvider = {
  id: 'avg_session_time',
  name: 'Average Session Length',
  category: 'engagement',
  unit: 'min',
  format: 'duration',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);
    const secs = INTERVAL_SECONDS[interval];
    const currentBucketStart = new Date(Math.floor(Date.now() / (secs * 1000)) * secs * 1000);

    // Include all buckets; mark the current one as partial
    const { rows } = await pool.query(
      `SELECT ${trunc} as bucket,
              AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0) as value
       FROM sessions
       WHERE game_id = $1
         AND started_at >= $2 AND started_at < $3
         AND ended_at IS NOT NULL
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    const data: TimeSeriesPoint[] = rows.map((r) => {
      const bucketDate = r.bucket instanceof Date ? r.bucket : new Date(String(r.bucket));
      const isCurrentBucket = bucketDate.getTime() >= currentBucketStart.getTime();
      return {
        date: formatRowDate(r.bucket, interval),
        value: Math.round(Number(r.value) * 100) / 100,
        ...(isCurrentBucket ? { partial: true } : {}),
      };
    });

    return { type: 'timeseries', data };
  },
};
