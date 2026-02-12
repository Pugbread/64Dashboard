import { useState, useEffect, useCallback } from 'react';
import { getProviderStat } from '../api/client';
import { ProviderMeta, TimeSeriesResult } from '../hooks/useStats';
import TimeSeriesChart from './TimeSeriesChart';
import { AlertTriangle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getProviderStat(gameId, category, provider.id, range, interval);
      const metric: TimeSeriesResult = data.metrics[provider.id] || { type: 'timeseries', data: [] };
      setResult(metric);
    } catch (err: any) {
      setResult(null);
      setError(err?.message || 'Failed to load');
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

  if (error) {
    return (
      <div className="card p-7">
        <div className="relative z-10">
          <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mb-2">{provider.name}</p>
          <div className="flex items-center gap-2 text-status-danger/70 mt-4">
            <AlertTriangle size={14} />
            <span className="text-[12px]">Failed to load data</span>
          </div>
          <button
            onClick={fetchData}
            className="mt-3 text-[11px] text-accent hover:text-accent-light transition-colors"
          >
            Retry
          </button>
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
