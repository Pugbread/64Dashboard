import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval, INTERVAL_SECONDS, formatRowDate } from '../types';

/** Map our interval codes to PostgreSQL interval strings for generate_series */
const PG_INTERVAL: Record<Interval, string> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '3h': '3 hours',
  '7h': '7 hours',
  '1d': '1 day',
};

export const d1RetentionProvider: StatProvider = {
  id: 'd1_retention',
  name: 'Day 1 Retention',
  category: 'retention',
  unit: '%',
  format: 'percentage',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    const isSubDay = INTERVAL_SECONDS[interval] < 86400;

    if (isSubDay) {
      return queryAccumulationCurve(pool, gameId, interval);
    }
    return queryDaily(pool, gameId, from, to);
  },
};

/**
 * Sub-day mode: accumulation curve for yesterday's cohort.
 * Shows how D1 retention % grows throughout today as players return.
 * Each point is cumulative — the 14:00 bucket shows all players who
 * returned at any point from 00:00 to 14:59, not just that hour.
 */
async function queryAccumulationCurve(
  pool: Pool,
  gameId: string,
  interval: Interval,
): Promise<TimeSeriesResult> {
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStartStr = todayStart.toISOString();
  const pgInterval = PG_INTERVAL[interval];

  const { rows } = await pool.query(
    `WITH cohort AS (
       -- Players whose first-ever session in this game was yesterday
       SELECT player_id
       FROM sessions
       WHERE game_id = $1
       GROUP BY player_id
       HAVING DATE(MIN(started_at)) = $2::date
     ),
     cohort_size AS (
       SELECT COUNT(*) AS cnt FROM cohort
     ),
     buckets AS (
       SELECT generate_series(
         $3::timestamp,
         NOW(),
         $4::interval
       ) AS bucket_end
     )
     SELECT b.bucket_end AS date,
            ROUND(
              COUNT(DISTINCT s.player_id)::NUMERIC
              / NULLIF((SELECT cnt FROM cohort_size), 0) * 100,
              2
            ) AS value
     FROM buckets b
     LEFT JOIN cohort c ON true
     LEFT JOIN sessions s
       ON  s.game_id   = $1
       AND s.player_id = c.player_id
       AND DATE(s.started_at) = $2::date + 1
       AND s.started_at <= b.bucket_end
     GROUP BY b.bucket_end
     ORDER BY b.bucket_end ASC`,
    [gameId, yesterdayStr, todayStartStr, pgInterval]
  );

  return {
    type: 'timeseries',
    data: rows.map((r) => ({
      date: formatRowDate(r.date, interval),
      value: Number(r.value || 0),
      partial: true, // all points are accumulating since today isn't over
    })),
  };
}

/**
 * Daily mode (3d+ timeframes): standard cohort-per-day D1 retention.
 * Yesterday's cohort is included and marked as partial.
 */
async function queryDaily(
  pool: Pool,
  gameId: string,
  from: Date,
  to: Date,
): Promise<TimeSeriesResult> {
  const { rows } = await pool.query(
    `WITH first_play AS (
       SELECT player_id, DATE(MIN(started_at)) AS first_day
       FROM sessions
       WHERE game_id = $1
       GROUP BY player_id
     ),
     cohorts AS (
       SELECT first_day, COUNT(*) AS cohort_size
       FROM first_play
       WHERE first_day >= $2::date
         AND first_day < $3::date
       GROUP BY first_day
     ),
     retained AS (
       SELECT fp.first_day, COUNT(DISTINCT fp.player_id) AS retained_count
       FROM first_play fp
       INNER JOIN sessions s
         ON  s.game_id   = $1
         AND s.player_id = fp.player_id
         AND DATE(s.started_at) = fp.first_day + 1
       WHERE fp.first_day >= $2::date
         AND fp.first_day < $3::date
       GROUP BY fp.first_day
     )
     SELECT c.first_day AS date,
            ROUND(COALESCE(r.retained_count, 0)::NUMERIC
                  / NULLIF(c.cohort_size, 0) * 100, 2) AS value
     FROM cohorts c
     LEFT JOIN retained r ON c.first_day = r.first_day
     ORDER BY c.first_day ASC`,
    [gameId, from.toISOString(), to.toISOString()]
  );

  // Tag yesterday's data point as partial
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return {
    type: 'timeseries',
    data: rows.map((r) => {
      const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
      return {
        date: dateStr,
        value: Number(r.value || 0),
        ...(dateStr === yesterdayStr ? { partial: true } : {}),
      };
    }),
  };
}
