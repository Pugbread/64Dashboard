import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { getCategoryStats } from '../api/client';
import { TimeSeriesPoint } from '../hooks/useStats';
import { AlertTriangle } from 'lucide-react';

interface RevenueComboChartProps {
  gameId: string;
  range: string;
  interval: string;
}

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
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
}

function formatTooltipLabel(dateStr: string, interval: string): string {
  if (interval === '1d') {
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return (
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
}

function formatRobux(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return `R$ ${value.toLocaleString()}`;
}

function buildUnifiedData(revenue: TimeSeriesPoint[], purchases: TimeSeriesPoint[]) {
  const map = new Map<string, { date: string; revenue: number; purchases: number }>();

  for (const p of revenue) {
    map.set(p.date, { date: p.date, revenue: p.value, purchases: 0 });
  }
  for (const p of purchases) {
    const existing = map.get(p.date);
    if (existing) {
      existing.purchases = p.value;
    } else {
      map.set(p.date, { date: p.date, revenue: 0, purchases: p.value });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return da - db;
  });
}

export default function RevenueComboChart({ gameId, range, interval }: RevenueComboChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<TimeSeriesPoint[]>([]);
  const [purchases, setPurchases] = useState<TimeSeriesPoint[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    getCategoryStats(gameId, 'revenue', range, interval)
      .then(({ data }) => {
        if (!alive) return;
        setRevenue(data?.metrics?.revenue?.data || []);
        setPurchases(data?.metrics?.purchases?.data || []);
      })
      .catch((err: any) => {
        if (!alive) return;
        setError(err?.message || 'Failed to load revenue chart');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [gameId, range, interval]);

  const chartData = useMemo(() => buildUnifiedData(revenue, purchases), [revenue, purchases]);
  const totalRevenue = useMemo(() => revenue.reduce((sum, p) => sum + p.value, 0), [revenue]);
  const totalPurchases = useMemo(() => purchases.reduce((sum, p) => sum + p.value, 0), [purchases]);

  if (loading) {
    return (
      <div className="card p-7 xl:col-span-2 animate-pulse">
        <div className="relative z-10">
          <div className="h-3 w-36 bg-white/5 rounded mb-3" />
          <div className="h-7 w-56 bg-white/5 rounded mb-6" />
          <div className="h-56 bg-white/[0.02] rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-7 xl:col-span-2">
        <div className="relative z-10">
          <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mb-2">Revenue & Purchases</p>
          <div className="flex items-center gap-2 text-status-danger/70 mt-4">
            <AlertTriangle size={14} />
            <span className="text-[12px]">Failed to load data</span>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card p-7 xl:col-span-2">
        <div className="relative z-10">
          <p className="text-[12px] text-text-secondary font-medium mb-6">Revenue & Purchases</p>
          <div className="h-56 flex items-center justify-center text-text-muted text-sm">
            No data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover p-7 xl:col-span-2">
      <div className="relative z-10">
        <p className="text-[12px] text-text-secondary font-medium mb-1">Revenue & Purchases</p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-6">
          <p className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight leading-none" title={`Total revenue: R$ ${totalRevenue.toLocaleString()}`}>
            {formatRobux(totalRevenue)}
          </p>
          <p className="text-[14px] sm:text-[16px] font-semibold text-text-secondary tracking-tight leading-none" title={`Total purchases: ${totalPurchases.toLocaleString()}`}>
            {totalPurchases.toLocaleString()} purchases
          </p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
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
                yAxisId="revenue"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : `${v}`)}
              />
              <YAxis
                yAxisId="purchases"
                orientation="right"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
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
                formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return [formatRobux(Number(value)), name];
                  return [Number(value).toLocaleString(), name];
                }}
                labelFormatter={(label) => formatTooltipLabel(label as string, interval)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />

              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#4ADE80"
                strokeWidth={2}
                fill="url(#rev-fill)"
                dot={false}
                activeDot={{ r: 4, fill: '#4ADE80', stroke: '#080808', strokeWidth: 2 }}
              />
              <Line
                yAxisId="purchases"
                type="monotone"
                dataKey="purchases"
                name="Purchases"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#60A5FA', stroke: '#080808', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
