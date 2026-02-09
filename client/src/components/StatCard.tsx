import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScalarResult, ProviderMeta } from '../hooks/useStats';

interface StatCardProps {
  provider: ProviderMeta;
  result: ScalarResult;
}

function formatValue(value: number, format?: string, unit?: string): string {
  if (format === 'duration') {
    if (value < 1) return `${Math.round(value * 60)}s`;
    return `${value.toFixed(1)} min`;
  }
  if (format === 'currency') {
    return `${unit || 'R$'} ${value.toLocaleString()}`;
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function getChangePercent(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function StatCard({ provider, result }: StatCardProps) {
  const change = getChangePercent(result.value, result.previousValue);

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-surface-700 transition-colors">
      <p className="text-sm text-surface-400 font-medium">{provider.name}</p>
      <div className="flex items-end justify-between mt-2">
        <p className="text-2xl font-bold text-white">
          {formatValue(result.value, provider.format, provider.unit)}
        </p>
        {change !== null && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-surface-400'
            }`}
          >
            {change > 0 ? (
              <TrendingUp size={14} />
            ) : change < 0 ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
