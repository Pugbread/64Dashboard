import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TimeSeriesResult, ProviderMeta } from '../hooks/useStats';

interface TimeSeriesChartProps {
  provider: ProviderMeta;
  result: TimeSeriesResult;
  interval: string;
}

const CATEGORY_STROKES: Record<string, string> = {
  engagement: '#FFFFFF',
  revenue: '#22C55E',
  retention: '#F59E0B',
};

function formatTick(dateStr: string, interval: string): string {
  if (interval === '1d') {
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (['1m', '5m', '30m', '1h'].includes(interval)) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
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
  if (format === 'duration') return `${value.toFixed(1)} min`;
  if (format === 'currency') return `${unit || 'R$'} ${value.toLocaleString()}`;
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function TimeSeriesChart({ provider, result, interval }: TimeSeriesChartProps) {
  const stroke = CATEGORY_STROKES[provider.category] || '#FFFFFF';

  if (result.data.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide mb-4">
          {provider.name}
        </p>
        <div className="h-44 flex items-center justify-center text-text-muted text-sm">
          No data available
        </div>
      </div>
    );
  }

  // Compute summary value (latest point)
  const latest = result.data[result.data.length - 1];
  const summaryValue = formatValue(latest.value, provider.format, provider.unit);

  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide">
          {provider.name}
        </p>
      </div>
      <p className="text-[22px] font-bold text-white tracking-tight leading-none mb-4">
        {summaryValue}
      </p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={result.data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.1} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatTick(d, interval)}
              tick={{ fill: '#555', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#555', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111',
                border: '1px solid #1E1E1E',
                borderRadius: '3px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatValue(value, provider.format, provider.unit), provider.name]}
              labelFormatter={(label) => formatTooltipLabel(label as string, interval)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={1.5}
              fill={`url(#g-${provider.id})`}
              dot={false}
              activeDot={{ r: 3, fill: stroke, stroke: '#000', strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
