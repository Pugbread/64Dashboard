import { Pool } from 'pg';

// ── Ranges ──────────────────────────────────────────────────
export type Range = '1h' | '6h' | '24h' | '3d' | '7d' | '30d';

export const RANGE_MS: Record<Range, number> = {
  '1h':  60 * 60 * 1000,
  '6h':  6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d':  3 * 24 * 60 * 60 * 1000,
  '7d':  7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// ── Intervals ───────────────────────────────────────────────
export type Interval = '1m' | '5m' | '30m' | '1h' | '3h' | '7h' | '1d';

export const INTERVAL_SECONDS: Record<Interval, number> = {
  '1m':  60,
  '5m':  300,
  '30m': 1800,
  '1h':  3600,
  '3h':  10800,
  '7h':  25200,
  '1d':  86400,
};

/** Which intervals are valid for each range */
export const INTERVAL_AVAILABILITY: Record<Range, Interval[]> = {
  '1h':  ['1m', '5m', '30m'],
  '6h':  ['5m', '30m', '1h', '3h'],
  '24h': ['30m', '1h', '3h', '7h'],
  '3d':  ['30m', '1h', '3h', '7h', '1d'],
  '7d':  ['1h', '3h', '7h', '1d'],
  '30d': ['3h', '7h', '1d'],
};

/** Default interval for each range */
export const DEFAULT_INTERVAL: Record<Range, Interval> = {
  '1h':  '1m',
  '6h':  '5m',
  '24h': '1h',
  '3d':  '3h',
  '7d':  '1d',
  '30d': '1d',
};

// ── Data types ──────────────────────────────────────────────
export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TimeSeriesResult {
  type: 'timeseries';
  data: TimeSeriesPoint[];
}

export type StatResult = TimeSeriesResult;

export type StatCategory = string;

export interface StatProvider {
  id: string;
  name: string;
  category: StatCategory;
  unit?: string;
  format?: 'number' | 'duration' | 'currency' | 'percentage';
  query(pool: Pool, gameId: string, from: Date, to: Date, interval: Interval): Promise<TimeSeriesResult>;
}

// ── SQL helpers ─────────────────────────────────────────────

/**
 * Returns a SQL expression that truncates a timestamp column to the
 * given interval bucket.  Uses epoch-math for sub-day and multi-hour
 * intervals; DATE() for 1 day.
 */
export function intervalTrunc(column: string, interval: Interval): string {
  if (interval === '1d') return `DATE(${column})`;
  const secs = INTERVAL_SECONDS[interval];
  return `to_timestamp(floor(extract(epoch from ${column}) / ${secs}) * ${secs})`;
}

/**
 * Format a DB row date to a string the frontend can parse.
 */
export function formatRowDate(date: any, interval: Interval): string {
  if (date instanceof Date) {
    if (interval === '1d') return date.toISOString().split('T')[0];
    return date.toISOString();
  }
  return String(date);
}
