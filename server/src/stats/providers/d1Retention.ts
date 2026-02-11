import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval } from '../types';

export const d1RetentionProvider: StatProvider = {
  id: 'd1_retention',
  name: 'Day 1 Retention',
  category: 'retention',
  unit: '%',
  format: 'percentage',

  async query(pool: Pool, gameId: string, from: Date, to: Date, _interval: Interval): Promise<TimeSeriesResult> {
    // D1 Retention — matches GameAnalytics' strict retention:
    //   "The percent of users who installed on day D and returned N days later.
    //    Strict retention: a user is retained only if they revisit on the exact
    //    specified day N. Days are counted in UTC."
    //
    // For each calendar day D in the range:
    //   1. Cohort = players whose FIRST EVER session started on day D.
    //   2. Retained = those cohort players who had ANY session on day D+1.
    //   3. D1 = retained / cohort * 100
    //
    // We only show cohorts where day D+1 has FULLY passed (standard GA behavior).
    // This means the latest cohort shown is (today_utc - 2), because:
    //   - (today - 2)'s D1 is (today - 1), which has fully passed.
    //   - (today - 1)'s D1 is today, which hasn't ended yet → excluded.

    // Compute the cutoff: only include cohorts where D+1 < today (UTC)
    // i.e. first_day < today - 1
    const cutoff = new Date();
    cutoff.setUTCHours(0, 0, 0, 0); // start of today UTC
    // first_day must be < cutoff - 1 day so that first_day+1 < cutoff (fully passed)
    const maxCohortDate = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000);

    const { rows } = await pool.query(
      `WITH first_play AS (
         -- First-ever session date per player in this game
         SELECT player_id, DATE(MIN(started_at)) AS first_day
         FROM sessions
         WHERE game_id = $1
         GROUP BY player_id
       ),
       cohorts AS (
         -- Cohort sizes per day within the visible range
         SELECT first_day, COUNT(*) AS cohort_size
         FROM first_play
         WHERE first_day >= $2::date
           AND first_day < $4::date
         GROUP BY first_day
       ),
       retained AS (
         -- Players who returned on exactly first_day + 1
         SELECT fp.first_day, COUNT(DISTINCT fp.player_id) AS retained_count
         FROM first_play fp
         INNER JOIN sessions s
           ON  s.game_id   = $1
           AND s.player_id = fp.player_id
           AND DATE(s.started_at) = fp.first_day + 1
         WHERE fp.first_day >= $2::date
           AND fp.first_day < $4::date
         GROUP BY fp.first_day
       )
       SELECT c.first_day                                               AS date,
              ROUND(COALESCE(r.retained_count, 0)::NUMERIC
                    / NULLIF(c.cohort_size, 0) * 100, 2)                AS value
       FROM cohorts c
       LEFT JOIN retained r ON c.first_day = r.first_day
       ORDER BY c.first_day ASC`,
      [gameId, from.toISOString(), to.toISOString(), maxCohortDate.toISOString()]
    );

    return {
      type: 'timeseries',
      data: rows.map((r) => ({
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
        value: Number(r.value || 0),
      })),
    };
  },
};
