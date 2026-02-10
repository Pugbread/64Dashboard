import { useState, useEffect, useCallback } from 'react';
import { getStats } from '../api/client';

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface ScalarResult {
  type: 'scalar';
  value: number;
  previousValue?: number;
}

export interface TimeSeriesResult {
  type: 'timeseries';
  data: TimeSeriesPoint[];
}

export type StatResult = ScalarResult | TimeSeriesResult;

export interface ProviderMeta {
  id: string;
  name: string;
  category: string;
  resultType: string;
  unit?: string;
  format?: string;
}

export interface StatsResponse {
  gameId: string;
  range: string;
  interval: string;
  from: string;
  to: string;
  metrics: Record<string, StatResult>;
  providers: ProviderMeta[];
  categories: string[];
}

export function useStats(gameId: string | null, range: string, interval: string = 'daily') {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      const { data: stats } = await getStats(gameId, range, interval);
      setData(stats);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [gameId, range, interval]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
