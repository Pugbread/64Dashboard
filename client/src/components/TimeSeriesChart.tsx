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

const CHART_COLORS: Record<string, { stroke: string; fill: string; gradientId: string }> = {
  engagement: { stroke: '#8E54E9', fill: '#8E54E9', gradientId: 'purple' },
  revenue: { stroke: '#4ADE80', fill: '#4ADE80', gradientId: 'green' },
  retention: { stroke: '#FF49DB', fill: '#FF49DB', gradientId: 'pink' },
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
      <div className="card p-5">
        <p className="text-[13px] text-text-secondary font-medium mb-4">{provider.name}</p>
        <div className="h-52 flex items-center justify-center text-text-muted text-sm">
          No data available for this period
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover p-5">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[13px] text-text-secondary font-medium">{provider.name}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: colors.stroke, boxShadow: `0 0 6px ${colors.stroke}` }} />
            <span className="text-[11px] text-text-muted">Current Period</span>
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.fill} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: '#6B6B76', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B6B76', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A161F',
                  border: '1px solid #2D2D2D',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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
                fill={`url(#grad-${provider.id})`}
                dot={false}
                activeDot={{ r: 4, fill: colors.stroke, stroke: '#000', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
