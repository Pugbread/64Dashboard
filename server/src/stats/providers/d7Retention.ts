import { Pool } from 'pg';
import { StatProvider, TimeSeriesResult, Interval } from '../types';
import { queryCohortRetention } from './retentionHelper';

export const d7RetentionProvider: StatProvider = {
  id: 'd7_retention',
  name: 'Day 7 Retention',
  category: 'retention',
  unit: '%',
  format: 'percentage',

  async query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult> {
    return queryCohortRetention(pool, gameId, from, to, 7, interval);
  },
};
