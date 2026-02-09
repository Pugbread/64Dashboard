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
}

const CHART_COLORS: Record<string, { stroke: string; fill: string }> = {
  engagement: { stroke: '#818cf8', fill: '#818cf820' },
  revenue: { stroke: '#22c55e', fill: '#22c55e20' },
  retention: { stroke: '#f59e0b', fill: '#f59e0b20' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTooltipValue(value: number, format?: string, unit?: string): string {
  if (format === 'duration') return `${value.toFixed(1)} min`;
  if (format === 'currency') return `${unit || 'R$'} ${value.toLocaleString()}`;
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function TimeSeriesChart({ provider, result }: TimeSeriesChartProps) {
  const colors = CHART_COLORS[provider.category] || CHART_COLORS.engagement;

  if (result.data.length === 0) {
    return (
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
        <p className="text-sm text-surface-400 font-medium mb-4">{provider.name}</p>
        <div className="h-48 flex items-center justify-center text-surface-500 text-sm">
          No data available for this period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-surface-700 transition-colors">
      <p className="text-sm text-surface-400 font-medium mb-4">{provider.name}</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={result.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
              }}
              formatter={(value: number) => [
                formatTooltipValue(value, provider.format, provider.unit),
                provider.name,
              ]}
              labelFormatter={(label) => formatDate(label as string)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.stroke}
              strokeWidth={2}
              fill={`url(#gradient-${provider.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
