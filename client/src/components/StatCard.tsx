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

const CATEGORY_ICONS: Record<string, { color: string; bg: string }> = {
  engagement: { color: '#8E54E9', bg: 'rgba(142, 84, 233, 0.1)' },
  revenue: { color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)' },
  retention: { color: '#FF49DB', bg: 'rgba(255, 73, 219, 0.1)' },
};

export default function StatCard({ provider, result }: StatCardProps) {
  const change = getChangePercent(result.value, result.previousValue);
  const catStyle = CATEGORY_ICONS[provider.category] || CATEGORY_ICONS.engagement;

  return (
    <div className="card card-hover p-5 relative">
      <div className="relative z-10">
        {/* Icon + Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: catStyle.bg }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: catStyle.color, boxShadow: `0 0 8px ${catStyle.color}` }} />
          </div>
          <p className="text-[13px] text-text-secondary font-medium">{provider.name}</p>
        </div>

        {/* Value */}
        <p className="text-[32px] font-bold text-white tracking-tight leading-none mb-3">
          {formatValue(result.value, provider.format, provider.unit)}
        </p>

        {/* Change indicator */}
        {change !== null && (
          <div className="flex items-center gap-2">
            <span
              className={`pill ${change >= 0 ? 'pill-success' : 'pill-error'}`}
            >
              {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-[11px] text-text-muted">vs previous period</span>
          </div>
        )}
      </div>
    </div>
  );
}
