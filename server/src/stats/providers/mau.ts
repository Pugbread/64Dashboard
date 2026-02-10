import { Pool } from 'pg';
import { StatProvider, ScalarResult, Interval } from '../types';

export const mauProvider: StatProvider = {
  id: 'mau',
  name: 'Monthly Active Users',
  category: 'engagement',
  resultType: 'scalar',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date, _interval?: Interval): Promise<ScalarResult> {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT player_id) as value
       FROM sessions
       WHERE game_id = $1 AND started_at >= $2 AND started_at < $3`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    const duration = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - duration);
    const prevTo = from;

    const { rows: prevRows } = await pool.query(
      `SELECT COUNT(DISTINCT player_id) as value
       FROM sessions
       WHERE game_id = $1 AND started_at >= $2 AND started_at < $3`,
      [gameId, prevFrom.toISOString(), prevTo.toISOString()]
    );

    return {
      type: 'scalar',
      value: Number(rows[0]?.value || 0),
      previousValue: Number(prevRows[0]?.value || 0),
    };
  },
};
