import { Pool } from 'pg';
import { TimeSeriesResult } from '../types';

/**
 * Generic Day-N cohort retention query.
 *
 * For each day in [from, to), finds the cohort of players whose
 * first-ever session was that day, then checks how many returned
 * exactly N days later.
 *
 * Only includes cohort days where day + N has at least started (i.e.
 * cohort_day + N <= today). The cohort whose D-N window is today is
 * marked as partial/accumulating.
 */
export async function queryCohortRetention(
  pool: Pool,
  gameId: string,
  from: Date,
  to: Date,
  dayOffset: number,
): Promise<TimeSeriesResult> {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Latest cohort day whose D-N window has started = today - dayOffset
  const latestCohortDay = new Date(todayUTC.getTime() - dayOffset * 86400000);
  const latestCohortStr = latestCohortDay.toISOString().split('T')[0];

  // Clamp the from/to to only include cohorts with a valid D-N window
  const effectiveTo = new Date(Math.min(to.getTime(), latestCohortDay.getTime() + 86400000));

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
    [gameId, from.toISOString(), effectiveTo.toISOString(), dayOffset]
  );

  return {
    type: 'timeseries',
    data: rows.map((r) => {
      const dateStr = String(r.date).slice(0, 10);
      return {
        date: dateStr,
        value: Number(r.value || 0),
        // The cohort whose D-N window is today is still accumulating
        ...(dateStr === latestCohortStr ? { partial: true } : {}),
      };
    }),
  };
}
