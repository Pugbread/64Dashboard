import { useState, useEffect, useCallback } from 'react';
import { getCategoryStats } from '../api/client';

export type Range = '1h' | '6h' | '24h' | '3d' | '7d' | '30d';
export type Interval = '1m' | '5m' | '30m' | '1h' | '3h' | '7h' | '1d';

export interface TimeSeriesPoint {
  date: string;
  value: number;
  partial?: boolean; // true if this bucket is still accumulating
}

export interface TimeSeriesProjection {
  atDate: string;
  value: number;
}

export interface TimeSeriesResult {
  type: 'timeseries';
  data: TimeSeriesPoint[];
  projection?: TimeSeriesProjection;
}

export interface ProviderMeta {
  id: string;
  name: string;
  category: string;
  unit?: string;
  format?: string;
}

export interface CategoryStatsResponse {
  gameId: string;
  category: string;
  range: string;
  interval: string;
  from: string;
  to: string;
  providers: ProviderMeta[];
  metrics: Record<string, TimeSeriesResult>;
}

export function useCategoryStats(gameId: string | null, category: string, range: string, interval: string) {
  const [data, setData] = useState<CategoryStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const { data: stats } = await getCategoryStats(gameId, category, range, interval);
      setData(stats);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [gameId, category, range, interval]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
