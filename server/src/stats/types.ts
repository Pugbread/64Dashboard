import { Pool } from 'pg';

export interface TimeSeriesPoint {
  date: string; // ISO date string YYYY-MM-DD
  value: number;
}

export interface ScalarResult {
  type: 'scalar';
  value: number;
  previousValue?: number; // For calculating % change
}

export interface TimeSeriesResult {
  type: 'timeseries';
  data: TimeSeriesPoint[];
}

export type StatResult = ScalarResult | TimeSeriesResult;

export interface StatProvider {
  /** Unique identifier, e.g. "dau" */
  id: string;
  /** Display name, e.g. "Daily Active Users" */
  name: string;
  /** Category for UI grouping */
  category: 'engagement' | 'revenue' | 'retention';
  /** How to render: scalar = KPI card, timeseries = chart */
  resultType: 'scalar' | 'timeseries';
  /** Optional unit for display (e.g. "minutes", "R$", "%") */
  unit?: string;
  /** Optional format hint for the frontend */
  format?: 'number' | 'duration' | 'currency' | 'percentage';
  /** Execute the stat query */
  query(pool: Pool, gameId: string, from: Date, to: Date): Promise<StatResult>;
}
