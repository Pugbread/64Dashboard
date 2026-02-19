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
import { formatCurrency, useCurrencyMode } from '../lib/currency';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
  const { currencyMode } = useCurrencyMode();
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
      <div className="card p-6 xl:col-span-2 animate-pulse">
        <div className="relative z-10">
          <div className="h-3 w-32 bg-white/[0.04] rounded-btn mb-3" />
          <div className="h-8 w-48 bg-white/[0.04] rounded-btn mb-5" />
          <div className="h-56 bg-white/[0.02] rounded-btn" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 xl:col-span-2">
        <div className="relative z-10">
          <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mb-2">Revenue & Purchases</p>
          <div className="flex items-center gap-2 text-status-danger/80 mt-4">
            <AlertTriangle size={14} />
            <span className="text-[12px] font-medium">Failed to load data</span>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card p-6 xl:col-span-2">
        <div className="relative z-10">
          <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wider mb-6">Revenue & Purchases</p>
          <div className="h-56 flex items-center justify-center text-text-muted text-sm font-medium">
            No data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover p-6 xl:col-span-2">
      <div className="relative z-10">
        <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wider mb-1">Revenue & Purchases</p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-5">
          <p className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight leading-none" title={`Total revenue: ${formatCurrency(totalRevenue, currencyMode, true)}`}>
            {formatCurrency(totalRevenue, currencyMode, false)}
          </p>
          <p className="text-[13px] sm:text-[15px] font-semibold text-text-secondary tracking-tight leading-none" title={`Total purchases: ${totalPurchases.toLocaleString()}`}>
            {totalPurchases.toLocaleString()} purchases
          </p>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatTick(d, interval)}
                tick={{ fill: '#525866', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fill: '#525866', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(Number(v), currencyMode, false)}
              />
              <YAxis
                yAxisId="purchases"
                orientation="right"
                tick={{ fill: '#525866', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111114',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  padding: '10px 14px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return [formatCurrency(Number(value), currencyMode, false), name];
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
                stroke="#34D399"
                strokeWidth={2}
                fill="url(#rev-fill)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#34D399',
                  stroke: '#09090b',
                  strokeWidth: 2,
                }}
                isAnimationActive={!isMobile}
              />
              <Line
                yAxisId="purchases"
                type="monotone"
                dataKey="purchases"
                name="Purchases"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#60A5FA', stroke: '#09090b', strokeWidth: 2 }}
                isAnimationActive={!isMobile}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
