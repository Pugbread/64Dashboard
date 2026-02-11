import { useState, useEffect, useCallback } from 'react';
import { getProviderStat } from '../api/client';
import { ProviderMeta, TimeSeriesResult } from '../hooks/useStats';
import TimeSeriesChart from './TimeSeriesChart';

interface LazyChartProps {
  gameId: string;
  category: string;
  provider: ProviderMeta;
  range: string;
  interval: string;
}

export default function LazyChart({ gameId, category, provider, range, interval }: LazyChartProps) {
  const [result, setResult] = useState<TimeSeriesResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProviderStat(gameId, category, provider.id, range, interval);
      const metric: TimeSeriesResult = data.metrics[provider.id] || { type: 'timeseries', data: [] };
      setResult(metric);
    } catch {
      setResult({ type: 'timeseries', data: [] });
    } finally {
      setLoading(false);
    }
  }, [gameId, category, provider.id, range, interval]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="card p-7 animate-pulse">
        <div className="relative z-10">
          <div className="h-3 w-28 bg-white/5 rounded mb-3" />
          <div className="h-7 w-20 bg-white/5 rounded mb-6" />
          <div className="h-44 bg-white/[0.02] rounded" />
        </div>
      </div>
    );
  }

  return (
    <TimeSeriesChart
      provider={provider}
      result={result || { type: 'timeseries', data: [] }}
      interval={interval}
    />
  );
}
