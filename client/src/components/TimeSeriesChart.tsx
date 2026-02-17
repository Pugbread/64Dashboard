import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import { TimeSeriesResult, ProviderMeta, TimeSeriesPoint } from '../hooks/useStats';
import { formatCurrency, useCurrencyMode } from '../lib/currency';

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

type ChartPoint = {
  date: string;
  solid: number | null;
  partial: number | null;
  estimate: number | null;
};

/**
 * Build chart data with split solid/partial/estimate series.
 *
 * - `solid`: completed data points
 * - `partial`: dashed segment for accumulating data (bridge + partial points)
 * - `estimate`: blue dotted line from the partial value to the projected value
 *
 * The estimate line goes from the partial point's actual value to the projected
 * value, both at the SAME x-coordinate. To draw this as a visible line segment,
 * we put the estimate start on the second-to-last point (at the bridge or
 * second-to-last partial), and the estimate end on the last partial point.
 */
function buildChartData(data: TimeSeriesPoint[], projection?: TimeSeriesResult['projection']): ChartPoint[] {
  const hasPartial = data.some((p) => p.partial);
  let base: ChartPoint[] = hasPartial
    ? (() => {
      const partialIdx = data.findIndex((p) => p.partial);
      return data.map((p, i) => {
        if (i < partialIdx - 1) return { date: p.date, solid: p.value, partial: null, estimate: null };
        if (i === partialIdx - 1) return { date: p.date, solid: p.value, partial: p.value, estimate: null };
        return { date: p.date, solid: null, partial: p.value, estimate: null };
      });
    })()
    : data.map((p) => ({ date: p.date, solid: p.value, partial: null, estimate: null }));

  if (!projection) return base;

  // Find the partial point where the projection sits
  const atIdx = base.findIndex((p) => p.date === projection.atDate);
  if (atIdx < 0) return base;

  // Set estimate on the projection point to the estimated value
  base[atIdx] = { ...base[atIdx], estimate: projection.value };

  // Also set estimate on the previous point so the line has a visible segment
  // (from previous point's actual value → projection point's estimated value)
  if (atIdx > 0) {
    const prev = base[atIdx - 1];
    base[atIdx - 1] = { ...prev, estimate: prev.partial ?? prev.solid };
  }

  return base;
}

export default function TimeSeriesChart({ provider, result, interval }: TimeSeriesChartProps) {
  const { currencyMode } = useCurrencyMode();
  const color = CATEGORY_COLORS[provider.category] || '#3B82F6';
  const hasPartial = result.data.some((p) => p.partial);
  const hasProjection = provider.category === 'retention' && !!result.projection;

  const formatValue = (value: number, format?: string): string => {
    if (format === 'duration') {
      if (value < 1) return `${Math.round(value * 60)}s`;
      return `${value.toFixed(1)}m`;
    }
    if (format === 'currency') return formatCurrency(value, currencyMode, false);
    if (format === 'percentage') return `${value.toFixed(1)}%`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatValueFull = (value: number, format?: string): string => {
    if (format === 'duration') {
      const mins = Math.floor(value);
      const secs = Math.round((value - mins) * 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    if (format === 'currency') return formatCurrency(value, currencyMode, true);
    if (format === 'percentage') return `${value.toFixed(2)}%`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

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
  const displayValue = formatValue(avg, provider.format);
  const chartData = buildChartData(result.data, hasProjection ? result.projection : undefined);
  const yMaxBase = Math.max(...result.data.map((p) => p.value), 0);
  const yMax = hasProjection ? Math.max(yMaxBase, result.projection?.value ?? 0) : yMaxBase;

  const isRevenue = provider.id === 'revenue';

  return (
    <div className="card card-hover p-7">
      <div className="relative z-10">
        <p className="text-[12px] text-text-secondary font-medium mb-1">{provider.name}</p>
        {isRevenue ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-6">
            <p className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight leading-none" title={`Total: ${formatValueFull(total, provider.format)}`}>
              Total: {formatValue(total, provider.format)}
            </p>
            <p className="text-[14px] sm:text-[16px] font-semibold text-text-secondary tracking-tight leading-none" title={`Average: ${formatValueFull(avg, provider.format)}`}>
              Average: {formatValue(avg, provider.format)}
            </p>
          </div>
        ) : (
          <p className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight leading-none mb-6" title={formatValueFull(avg, provider.format)}>
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
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, yMax > 0 ? yMax * 1.15 : 1]}
                tickFormatter={(v) =>
                  provider.format === 'currency'
                    ? formatCurrency(Number(v), currencyMode, false)
                    : Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
                }
              />
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
                formatter={(value: any, name: string, props: any) => {
                  if (value === null || value === undefined) return [null, null];
                  const payload = props?.payload;
                  // On bridge point (both solid & partial exist), skip the duplicate partial entry
                  if (name === 'partial' && payload?.solid != null) return [null, null];
                  // Estimate: show it, but skip on bridge point where it equals the actual value
                  if (name === 'estimate') {
                    const actualVal = payload?.partial ?? payload?.solid;
                    if (actualVal != null && Math.abs(Number(actualVal) - Number(value)) < 0.05) return [null, null];
                    return [formatValue(Number(value), provider.format), `${provider.name} (estimated)`];
                  }
                  const label = name === 'partial' ? `${provider.name} (accumulating)` : provider.name;
                  return [formatValue(Number(value), provider.format), label];
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

              {/* Blue dotted estimate line — branches from partial to estimated value */}
              {hasProjection && (
                <Area
                  type="monotone"
                  dataKey="estimate"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                  dot={false}
                  activeDot={{ r: 5, fill: '#60A5FA', stroke: '#0B1220', strokeWidth: 2 }}
                  connectNulls
                />
              )}

              {/* Blue dot at the estimated final value */}
              {hasProjection && result.projection && (
                <ReferenceDot
                  x={result.projection.atDate}
                  y={result.projection.value}
                  r={5}
                  fill="#60A5FA"
                  stroke="#0B1220"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
