import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval } from '../types';

export const d1RetentionProvider: StatProvider = {
  id: 'd1_retention',
  name: 'Day 1 Retention',
  category: 'retention',
  unit: '%',
  format: 'percentage',

  async query(pool: Pool, gameId: string, from: Date, to: Date, _interval: Interval): Promise<TimeSeriesResult> {
    // D1 retention is inherently a daily metric (cohort per calendar day).
    // For each day in the range:
    //   1. Find players whose FIRST EVER session in this game started on that day (the cohort).
    //   2. Check how many of those players had ANY session the next calendar day.
    //   3. retention = retained / cohort_size * 100
    //
    // We can only compute this for days at least 1 day before "to",
    // since we need the full next day to have passed.

    // Include yesterday's cohort — their D1 data is accumulative (today isn't over)
    const { rows } = await pool.query(
      `WITH first_play AS (
         -- First-ever session date per player in this game
         SELECT player_id, DATE(MIN(started_at)) AS first_day
         FROM sessions
         WHERE game_id = $1
         GROUP BY player_id
       ),
       cohorts AS (
         -- Cohort sizes per day within the range
         SELECT first_day, COUNT(*) AS cohort_size
         FROM first_play
         WHERE first_day >= $2::date AND first_day < $3::date
         GROUP BY first_day
       ),
       retained AS (
         -- Players who returned exactly 1 day after their first_day
         SELECT fp.first_day, COUNT(DISTINCT fp.player_id) AS retained_count
         FROM first_play fp
         INNER JOIN sessions s
           ON  s.game_id   = $1
           AND s.player_id = fp.player_id
           AND DATE(s.started_at) = fp.first_day + 1
         WHERE fp.first_day >= $2::date AND fp.first_day < $3::date
         GROUP BY fp.first_day
       )
       SELECT c.first_day                                               AS date,
              ROUND(COALESCE(r.retained_count, 0)::NUMERIC
                    / NULLIF(c.cohort_size, 0) * 100, 2)                AS value
       FROM cohorts c
       LEFT JOIN retained r ON c.first_day = r.first_day
       ORDER BY c.first_day ASC`,
      [gameId, from.toISOString(), to.toISOString()]
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
