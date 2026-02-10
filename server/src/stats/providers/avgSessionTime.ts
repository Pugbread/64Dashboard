import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate, INTERVAL_SECONDS } from '../types';

export const avgSessionTimeProvider: StatProvider = {
  id: 'avg_session_time',
  name: 'Avg Session Time',
  category: 'engagement',
  unit: 'min',
  format: 'duration',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);

    // Compute the start of the current (incomplete) bucket so we can
    // exclude it — partial buckets have artificially low averages because
    // only very short completed sessions exist in them yet.
    const secs = INTERVAL_SECONDS[interval];
    const currentBucketStart = new Date(Math.floor(Date.now() / (secs * 1000)) * secs * 1000);

    const { rows } = await pool.query(
      `SELECT ${trunc} as bucket,
              AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0) as value
       FROM sessions
       WHERE game_id = $1
         AND started_at >= $2 AND started_at < $3
         AND ended_at IS NOT NULL
       GROUP BY bucket
       HAVING ${trunc} < $4
       ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString(), currentBucketStart.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Math.round(Number(r.value) * 100) / 100 })),
    };
  },
};
