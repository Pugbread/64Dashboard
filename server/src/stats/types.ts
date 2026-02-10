import { Pool } from 'pg';

export type Interval = 'hourly' | 'daily' | 'weekly';

export interface TimeSeriesPoint {
  date: string; // ISO date string YYYY-MM-DD or YYYY-MM-DDTHH:00
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

/**
 * Category definitions.
 * To add a new category, simply use any string as the category value in your provider.
 * The frontend will automatically create a new section for it.
 */
export type StatCategory = string;

export interface StatProvider {
  /** Unique identifier, e.g. "dau" */
  id: string;
  /** Display name, e.g. "Daily Active Users" */
  name: string;
  /** Category for UI grouping — use any string (e.g. 'engagement', 'revenue', 'retention') */
  category: StatCategory;
  /** How to render: scalar = KPI card, timeseries = chart */
  resultType: 'scalar' | 'timeseries';
  /** Optional unit for display (e.g. "minutes", "R$", "%") */
  unit?: string;
  /** Optional format hint for the frontend */
  format?: 'number' | 'duration' | 'currency' | 'percentage';
  /** Execute the stat query */
  query(pool: Pool, gameId: string, from: Date, to: Date, interval?: Interval): Promise<StatResult>;
}

/**
 * Helper: returns the SQL date_trunc expression and output format for a given interval.
 */
export function intervalTrunc(column: string, interval: Interval = 'daily'): string {
  switch (interval) {
    case 'hourly':
      return `date_trunc('hour', ${column})`;
    case 'weekly':
      return `date_trunc('week', ${column})`;
    case 'daily':
    default:
      return `DATE(${column})`;
  }
}

/**
 * Helper: format a DB row date value to a string based on interval.
 */
export function formatRowDate(date: any, interval: Interval = 'daily'): string {
  if (date instanceof Date) {
    if (interval === 'hourly') {
      return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  return String(date);
}
