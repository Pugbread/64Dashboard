import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, formatRowDate } from '../types';

export const avgPlaytimeProvider: StatProvider = {
  id: 'avg_playtime',
  name: 'Avg Daily Playtime per User',
  category: 'engagement',
  unit: 'min',
  format: 'duration',

  async query(pool: Pool, gameId: string, from: Date, to: Date, _interval: Interval): Promise<TimeSeriesResult> {
    // Always aggregated by calendar day regardless of selected interval.
    // For each day: total completed-session playtime / unique users.
    const { rows } = await pool.query(
      `SELECT DATE(started_at) as bucket,
              SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0) /
                NULLIF(COUNT(DISTINCT player_id), 0) as value
       FROM sessions
       WHERE game_id = $1
         AND started_at >= $2 AND started_at < $3
         AND ended_at IS NOT NULL
       GROUP BY bucket ORDER BY bucket ASC`,
      [gameId, from.toISOString(), to.toISOString()]
    );
    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: r.bucket instanceof Date ? r.bucket.toISOString().split('T')[0] : String(r.bucket),
        value: Math.round(Number(r.value || 0) * 100) / 100,
      })),
    };
  },
};
