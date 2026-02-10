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
  interval?: string;
}

const CATEGORY_STROKES: Record<string, string> = {
  engagement: '#FFFFFF',
  revenue: '#22C55E',
  retention: '#888888',
};

const INTERVAL_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
};

function formatDate(dateStr: string, interval: string = 'daily'): string {
  if (interval === 'hourly') {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (interval === 'weekly') {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return 'W ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTooltipLabel(dateStr: string, interval: string = 'daily'): string {
  if (interval === 'hourly') {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (interval === 'weekly') {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return 'Week of ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' - ' + end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
}

function formatTooltipValue(value: number, format?: string, unit?: string): string {
  if (format === 'duration') return `${value.toFixed(1)} min`;
  if (format === 'currency') return `${unit || 'R$'} ${value.toLocaleString()}`;
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function TimeSeriesChart({ provider, result, interval = 'daily' }: TimeSeriesChartProps) {
  const stroke = CATEGORY_STROKES[provider.category] || '#FFFFFF';

  if (result.data.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide mb-4">
          {provider.name}
        </p>
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide">
          {provider.name}
        </p>
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {INTERVAL_LABELS[interval] || interval}
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={result.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.1} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d, interval)}
              tick={{ fill: '#555', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#555', fontSize: 11 }}
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
              formatter={(value: number) => [
                formatTooltipValue(value, provider.format, provider.unit),
                provider.name,
              ]}
              labelFormatter={(label) => formatTooltipLabel(label as string, interval)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={1.5}
              fill={`url(#grad-${provider.id})`}
              dot={false}
              activeDot={{ r: 3, fill: stroke, stroke: '#000', strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
