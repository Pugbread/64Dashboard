import { TrendingUp, TrendingDown } from 'lucide-react';
import { ScalarResult, ProviderMeta } from '../hooks/useStats';

interface StatCardProps {
  provider: ProviderMeta;
  result: ScalarResult;
}

function formatValue(value: number, format?: string, unit?: string): string {
  if (format === 'duration') {
    if (value < 1) return `${Math.round(value * 60)}s`;
    return `${value.toFixed(1)}m`;
  }
  if (format === 'currency') {
    return `${unit || 'R$'}${value.toLocaleString()}`;
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
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
    <div className="card card-hover p-4">
      {/* Title */}
      <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide mb-3">
        {provider.name}
      </p>

      {/* Value */}
      <p className="text-[28px] font-bold text-white tracking-tight leading-none mb-2">
        {formatValue(result.value, provider.format, provider.unit)}
      </p>

      {/* Change indicator */}
      {change !== null && (
        <div className="flex items-center gap-2">
          <span className={`pill ${change >= 0 ? 'pill-success' : 'pill-error'}`}>
            {change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-[11px] text-text-muted">vs previous</span>
        </div>
      )}
    </div>
  );
}
