import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TimeSeriesResult, ProviderMeta, TimeSeriesPoint } from '../hooks/useStats';

interface TimeSeriesChartProps {
  provider: ProviderMeta;
  result: TimeSeriesResult;
  interval: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  engagement: '#3B82F6',
  revenue: '#4ADE80',
  retention: '#F59E0B',
};

function formatTick(dateStr: string, interval: string): string {
  if (interval === '1d') {
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (['1m', '5m', '30m', '1h'].includes(interval))
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatTooltipLabel(dateStr: string, interval: string): string {
  if (interval === '1d') {
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatValue(value: number, format?: string, unit?: string): string {
  if (format === 'duration') {
    if (value < 1) return `${Math.round(value * 60)}s`;
    return `${value.toFixed(1)}m`;
  }
  if (format === 'currency') return `${unit || 'R$'} ${value.toLocaleString()}`;
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Build chart data with split solid/partial series.
 * - `solid`: value for complete data points (null for partial-only points)
 * - `partial`: value for the dashed segment (bridge point + partial point)
 */
function buildChartData(data: TimeSeriesPoint[]) {
  const hasPartial = data.some((p) => p.partial);
  if (!hasPartial) {
    // No partial points — everything is solid
    return data.map((p) => ({ date: p.date, solid: p.value, partial: null as number | null }));
  }

  // Find the index where partial starts
  const partialIdx = data.findIndex((p) => p.partial);

  return data.map((p, i) => {
    if (i < partialIdx - 1) {
      // Pure solid
      return { date: p.date, solid: p.value, partial: null as number | null };
    }
    if (i === partialIdx - 1) {
      // Bridge point: both solid and partial connect here
      return { date: p.date, solid: p.value, partial: p.value };
    }
    if (i >= partialIdx) {
      // Partial segment
      return { date: p.date, solid: null as number | null, partial: p.value };
    }
    return { date: p.date, solid: p.value, partial: null as number | null };
  });
}

export default function TimeSeriesChart({ provider, result, interval }: TimeSeriesChartProps) {
  const color = CATEGORY_COLORS[provider.category] || '#3B82F6';
  const hasPartial = result.data.some((p) => p.partial);

  if (result.data.length === 0) {
    return (
      <div className="card p-7">
        <div className="relative z-10">
          <p className="text-[12px] text-text-secondary font-medium mb-6">{provider.name}</p>
          <div className="h-52 flex items-center justify-center text-text-muted text-sm">
            No data available
          </div>
        </div>
      </div>
    );
  }

  const avg = result.data.reduce((sum, p) => sum + p.value, 0) / result.data.length;
  const total = result.data.reduce((sum, p) => sum + p.value, 0);
  const displayValue = formatValue(avg, provider.format, provider.unit);
  const chartData = buildChartData(result.data);

  // Revenue gets both Total and Average in the headline
  const isRevenue = provider.id === 'revenue';

  return (
    <div className="card card-hover p-7">
      <div className="relative z-10">
        <p className="text-[12px] text-text-secondary font-medium mb-1">{provider.name}</p>
        {isRevenue ? (
          <div className="flex items-baseline gap-4 mb-6">
            <p className="text-[28px] font-bold text-white tracking-tight leading-none">
              Total: {formatValue(total, provider.format, provider.unit)}
            </p>
            <p className="text-[16px] font-semibold text-text-secondary tracking-tight leading-none">
              Average: {formatValue(avg, provider.format, provider.unit)}
            </p>
          </div>
        ) : (
          <p className="text-[28px] font-bold text-white tracking-tight leading-none mb-6">
            {displayValue}
          </p>
        )}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`g-${provider.id}-partial`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.10} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatTick(d, interval)}
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121214',
                  border: '1px solid #1E1E22',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  padding: '10px 14px',
                }}
                formatter={(value: any, name: string) => {
                  if (value === null || value === undefined) return [null, null];
                  const label = name === 'partial' ? `${provider.name} (accumulating)` : provider.name;
                  return [formatValue(Number(value), provider.format, provider.unit), label];
                }}
                labelFormatter={(label) => formatTooltipLabel(label as string, interval)}
              />

              {/* Solid line — complete data */}
              <Area
                type="monotone"
                dataKey="solid"
                stroke={color}
                strokeWidth={2}
                fill={`url(#g-${provider.id})`}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: '#080808', strokeWidth: 2 }}
                connectNulls={false}
              />

              {/* Dashed line — partial/accumulating data */}
              {hasPartial && (
                <Area
                  type="monotone"
                  dataKey="partial"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  fill={`url(#g-${provider.id}-partial)`}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: '#080808', strokeWidth: 2, strokeDasharray: '' }}
                  connectNulls={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
