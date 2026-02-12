import { Pool } from 'pg';
import { TimeSeriesResult, Interval, INTERVAL_SECONDS, formatRowDate } from '../types';

/** Map interval codes to PostgreSQL interval strings for generate_series */
const PG_INTERVAL: Record<Interval, string> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '3h': '3 hours',
  '7h': '7 hours',
  '1d': '1 day',
};

/**
 * Unified Day-N retention provider.
 *
 * Two modes:
 *  - Sub-day interval → accumulation curve: shows how the eligible cohort's
 *    retention % grows throughout today, plotted at the selected interval.
 *  - Daily interval   → standard daily cohort chart: one point per day showing
 *    finalized (or partially accumulating) D-N retention.
 */
export async function queryCohortRetention(
  pool: Pool,
  gameId: string,
  from: Date,
  to: Date,
  dayOffset: number,
  interval: Interval,
): Promise<TimeSeriesResult> {
  const isSubDay = INTERVAL_SECONDS[interval] < 86400;

  if (isSubDay) {
    return queryAccumulationCurve(pool, gameId, dayOffset, interval);
  }
  return queryDaily(pool, gameId, from, to, dayOffset);
}

/**
 * Sub-day mode: accumulation curve for the most recent eligible cohort.
 *
 * For D1: the cohort = players whose first session was yesterday.
 *         Their D1 window is today, so we plot cumulative returns throughout today.
 * For D7: the cohort = players whose first session was 7 days ago.
 *         Their D7 window is today, same idea.
 *
 * Each point is cumulative — the 14:00 bucket shows all players who
 * returned at any point from 00:00 to 14:59, not just that hour.
 * All points are partial since today isn't over yet.
 */
async function queryAccumulationCurve(
  pool: Pool,
  gameId: string,
  dayOffset: number,
  interval: Interval,
): Promise<TimeSeriesResult> {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const cohortDay = new Date(todayStart.getTime() - dayOffset * 86400000);

  const cohortDayStr = cohortDay.toISOString().split('T')[0];
  const todayStartStr = todayStart.toISOString();
  const pgInterval = PG_INTERVAL[interval];

  const { rows } = await pool.query(
    `WITH cohort AS (
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
       AND DATE(s.started_at) = ($2::date + $5)
       AND s.started_at <= b.bucket_end
     GROUP BY b.bucket_end
     ORDER BY b.bucket_end ASC`,
    [gameId, cohortDayStr, todayStartStr, pgInterval, dayOffset]
  );

  return {
    type: 'timeseries',
    data: rows.map((r) => ({
      date: formatRowDate(r.date, interval),
      value: Number(r.value || 0),
      partial: true,
    })),
  };
}

/**
 * Daily mode (1d interval): standard cohort-per-day D-N retention.
 *
 * Only includes cohort days whose D-N window has at least started.
 * The most recent eligible cohort (whose D-N window is today) is marked partial.
 */
async function queryDaily(
  pool: Pool,
  gameId: string,
  from: Date,
  to: Date,
  dayOffset: number,
): Promise<TimeSeriesResult> {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Latest cohort whose D-N window has at least started = today - dayOffset
  const latestCohortDay = new Date(todayUTC.getTime() - dayOffset * 86400000);
  const latestCohortStr = latestCohortDay.toISOString().split('T')[0];

  // Clamp to so we don't include cohorts whose D-N window hasn't started
  const effectiveTo = new Date(Math.min(to.getTime(), latestCohortDay.getTime() + 86400000));

  // If from is already past the latest eligible cohort, no data is possible
  const fromDate = new Date(from.getTime());
  if (fromDate >= effectiveTo) {
    return { type: 'timeseries', data: [] };
  }

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
         AND DATE(s.started_at) = fp.first_day + $4
       WHERE fp.first_day >= $2::date
         AND fp.first_day < $3::date
       GROUP BY fp.first_day
     )
     SELECT c.first_day::text AS date,
            ROUND(COALESCE(r.retained_count, 0)::NUMERIC
                  / NULLIF(c.cohort_size, 0) * 100, 2) AS value
     FROM cohorts c
     LEFT JOIN retained r ON c.first_day = r.first_day
     ORDER BY c.first_day ASC`,
    [gameId, fromDate.toISOString(), effectiveTo.toISOString(), dayOffset]
  );

  return {
    type: 'timeseries',
    data: rows.map((r) => {
      const dateStr = String(r.date).slice(0, 10);
      return {
        date: dateStr,
        value: Number(r.value || 0),
        ...(dateStr === latestCohortStr ? { partial: true } : {}),
      };
    }),
  };
}
