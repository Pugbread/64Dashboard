import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, intervalTrunc, formatRowDate, INTERVAL_SECONDS } from '../types';

export const avgPlaytimeProvider: StatProvider = {
  id: 'avg_playtime',
  name: 'Playtime per User',
  category: 'engagement',
  unit: 'min',
  format: 'duration',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const trunc = intervalTrunc('started_at', interval);

    // Exclude current incomplete bucket (partial buckets skew low)
    const secs = INTERVAL_SECONDS[interval];
    const currentBucketStart = new Date(Math.floor(Date.now() / (secs * 1000)) * secs * 1000);

    // Per bucket: total completed-session playtime / unique users
    const { rows } = await pool.query(
      `SELECT ${trunc} as bucket,
              SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0) /
                NULLIF(COUNT(DISTINCT player_id), 0) as value
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
      data: rows.map((r) => ({ date: formatRowDate(r.bucket, interval), value: Math.round(Number(r.value || 0) * 100) / 100 })),
    };
  },
};
