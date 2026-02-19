import { useState, useEffect, useCallback, useRef } from 'react';
import { getProviderStat } from '../api/client';
import { ProviderMeta, TimeSeriesResult } from '../hooks/useStats';
import TimeSeriesChart from './TimeSeriesChart';
import { AlertTriangle, RotateCw } from 'lucide-react';

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
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const { data } = await getProviderStat(gameId, category, provider.id, range, interval);
      if (controller.signal.aborted) return;
      const metric: TimeSeriesResult = data.metrics[provider.id] || { type: 'timeseries', data: [] };
      setResult(metric);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(err?.message || 'Failed to load');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [gameId, category, provider.id, range, interval]);

  useEffect(() => {
    fetchData();
    return () => { abortRef.current?.abort(); };
  }, [fetchData]);

  if (loading && !result) {
    return (
      <div className="card p-6">
        <div className="relative z-10 animate-pulse">
          <div className="h-3 w-24 bg-white/[0.04] rounded-btn mb-3" />
          <div className="h-8 w-20 bg-white/[0.04] rounded-btn mb-5" />
          <div className="h-44 bg-white/[0.02] rounded-btn" />
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="card p-6">
        <div className="relative z-10">
          <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mb-2">{provider.name}</p>
          <div className="flex items-center gap-2 text-status-danger/80 mt-4">
            <AlertTriangle size={14} />
            <span className="text-[12px] font-medium">Failed to load data</span>
          </div>
          <button
            onClick={fetchData}
            className="mt-3 flex items-center gap-1.5 text-[11px] text-accent hover:text-accent-light transition-colors font-medium"
          >
            <RotateCw size={11} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-4 right-4 z-20">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
        </div>
      )}
      <TimeSeriesChart
        provider={provider}
        result={result || { type: 'timeseries', data: [] }}
        interval={interval}
      />
    </div>
  );
}
