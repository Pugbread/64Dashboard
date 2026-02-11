import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval } from '../types';

export const d1RetentionProvider: StatProvider = {
  id: 'd1_retention',
  name: 'Day 1 Retention',
  category: 'retention',
  unit: '%',
  format: 'percentage',

  async query(pool: Pool, gameId: string, from: Date, to: Date, _interval: Interval): Promise<TimeSeriesResult> {
    // D1 Retention — GameAnalytics strict retention, accumulative:
    //   "The percent of users who installed on day D and returned exactly day D+1."
    //   Strict = only counts revisits on the EXACT day, not "day 1 or later".
    //   Days are counted in UTC.
    //
    // We include yesterday's cohort whose D+1 is today (still accumulating).
    // The last data point is tagged as `partial: true` so the frontend can
    // render it with a dashed line to indicate it's not yet final.

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
           AND first_day < $3::date
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
           AND fp.first_day < $3::date
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

    // Determine yesterday (UTC) to tag its data point as partial
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
  },
};
