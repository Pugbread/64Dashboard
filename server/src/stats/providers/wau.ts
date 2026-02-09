import { Pool } from 'pg';
import { StatProvider, ScalarResult } from '../types';

export const wauProvider: StatProvider = {
  id: 'wau',
  name: 'Weekly Active Users',
  category: 'engagement',
  resultType: 'scalar',
  format: 'number',

  async query(pool: Pool, gameId: string, from: Date, to: Date): Promise<ScalarResult> {
    // Current period
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT player_id) as value
       FROM sessions
       WHERE game_id = $1 AND started_at >= $2 AND started_at < $3`,
      [gameId, from.toISOString(), to.toISOString()]
    );

    // Previous period (same duration, shifted back)
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
