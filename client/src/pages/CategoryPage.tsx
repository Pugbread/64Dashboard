import { useState, useEffect } from 'react';
import { Range, Interval, ProviderMeta } from '../hooks/useStats';
import { useCCU } from '../hooks/useCCU';
import { useMeta } from '../hooks/useMeta';
import Dropdown from '../components/Dropdown';
import LazyChart from '../components/LazyChart';
import PlaytimeDistribution from '../components/PlaytimeDistribution';
import RevenueComboChart from '../components/RevenueComboChart';
import { Users, Trophy } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const RANGE_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

const RETENTION_RANGE_OPTIONS = [
  { value: '3d', label: 'Past 3 Days' },
  { value: '7d', label: 'Past 7 Days' },
  { value: '14d', label: 'Past 14 Days' },
  { value: '30d', label: 'Past 30 Days' },
];

const INTERVAL_OPTIONS: Record<string, string> = {
  '1m': '1 Minute', '5m': '5 Minutes', '30m': '30 Minutes',
  '1h': '1 Hour', '3h': '3 Hours', '7h': '7 Hours', '1d': '1 Day',
};

const INTERVAL_AVAILABILITY: Record<string, string[]> = {
  '1m': ['1h'],
  '5m': ['1h', '6h'],
  '30m': ['1h', '6h', '24h', '3d'],
  '1h': ['6h', '24h', '3d', '7d'],
  '3h': ['1h', '6h', '24h', '3d', '7d', '30d'],
  '7h': ['1h', '6h', '24h', '3d', '7d', '30d'],
  '1d': ['3d', '7d', '30d'],
};

const DEFAULT_INTERVAL: Record<string, string> = {
  '1h': '1m', '6h': '5m', '24h': '1h', '3d': '3h', '7d': '1d', '30d': '1d',
};

const CATEGORY_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  revenue: 'Revenue',
  retention: 'Retention',
};

function getAvailableIntervals(range: string) {
  return Object.entries(INTERVAL_AVAILABILITY)
    .filter(([, ranges]) => ranges.includes(range))
    .map(([iv]) => ({
      value: iv,
      label: INTERVAL_OPTIONS[iv] || iv,
    }));
}

interface CategoryPageProps {
  category: string;
  selectedGameId: string | null;
}

function useAnimatedNumber(target: number, durationMs = 350): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const start = value;
    const delta = target - start;
    if (delta === 0) return;

    const startAt = performance.now();
    let frame = 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min((now - startAt) / durationMs, 1);
      const eased = easeOutCubic(t);
      setValue(Math.round(start + delta * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]); // intentionally animate from current rendered value

  return value;
}

function MiniCcuSparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="h-12 rounded-btn bg-white/[0.02]" />;
  }

  const data = points.map((value, i) => ({ x: i, value }));

  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ccuAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(96,165,250,0.4)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.03)" />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgba(96,165,250,0.98)"
            strokeWidth={2.2}
            fill="url(#ccuAreaGradient)"
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CategoryPage({ category, selectedGameId }: CategoryPageProps) {
  const [range, setRange] = useState<Range>(category === 'retention' ? '7d' as Range : '24h');
  const [interval, setInterval] = useState<Interval>(category === 'retention' ? '1d' as Interval : '1h');
  const { meta } = useMeta();
  const { ccu, history, allTimeHigh, allTimeHighAt } = useCCU(category === 'engagement' ? selectedGameId : null);
  const animatedCcu = useAnimatedNumber(ccu);

  // Get providers for this category from meta
  const providers: ProviderMeta[] = meta
    ? meta.providers.filter((p) => p.category === category)
    : [];
  const isRevenueCategory = category === 'revenue';
  const standardProviders = isRevenueCategory
    ? providers.filter((p) => p.id !== 'revenue' && p.id !== 'purchases')
    : providers;

  // Reset range and interval to correct defaults when switching categories
  useEffect(() => {
    if (category === 'retention') {
      setRange('7d' as Range);
      setInterval('1d' as Interval);
    } else {
      setRange('24h' as Range);
      setInterval('1h' as Interval);
    }
  }, [category]);

  // Keep interval valid when range changes (non-retention only)
  useEffect(() => {
    if (category === 'retention') return;
    const available = getAvailableIntervals(range);
    if (!available.find((a) => a.value === interval)) {
      setInterval((DEFAULT_INTERVAL[range] || available[0]?.value || '1h') as Interval);
    }
  }, [range, category, interval]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          {CATEGORY_LABELS[category] || category}
        </h1>
        <p className="text-text-secondary text-[13px] mt-1">Analytics overview</p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {category === 'retention' ? (
            <Dropdown value={range} options={RETENTION_RANGE_OPTIONS} onChange={(v) => setRange(v as Range)} />
          ) : (
            <>
              <Dropdown value={range} options={RANGE_OPTIONS} onChange={(v) => setRange(v as Range)} />
              <Dropdown value={interval} options={getAvailableIntervals(range)} onChange={(v) => setInterval(v as Interval)} />
            </>
          )}
        </div>
      </div>

      {/* CCU cards */}
      {category === 'engagement' && ccu !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-5">
          <div className="card p-5">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-btn bg-accent-muted flex items-center justify-center">
                    <Users size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">CCU</p>
                    <p className="text-white text-2xl font-bold tracking-tight">{animatedCcu.toLocaleString()}</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse ml-1" />
              </div>
              <div className="mt-3">
                <MiniCcuSparkline points={history} />
              </div>
            </div>
          </div>
          <div className="card p-5 min-h-[118px]">
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-btn bg-yellow-500/10 flex items-center justify-center">
                  <Trophy size={16} className="text-yellow-400" />
                </div>
                <p className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">All Time High</p>
              </div>
              <p className="text-white text-[40px] leading-none font-extrabold tracking-tight mt-2">
                {allTimeHigh.toLocaleString()}
              </p>
              <div className="mt-auto pt-2 text-center">
                <p className="text-text-muted text-[10px] font-medium">
                  {allTimeHighAt ? new Date(allTimeHighAt).toLocaleDateString() : 'No ATH yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts — each loads independently */}
      {!selectedGameId ? (
        <div className="card p-16 text-center">
          <div className="relative z-10 text-text-secondary text-sm">Select a game to view analytics</div>
        </div>
      ) : providers.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="relative z-10 text-text-secondary text-sm">No providers for this category</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {isRevenueCategory && (
              <RevenueComboChart
                gameId={selectedGameId}
                range={range}
                interval={interval}
              />
            )}
            {standardProviders.map((p) => (
              <LazyChart
                key={`${p.id}-${range}-${interval}`}
                gameId={selectedGameId}
                category={category}
                provider={p}
                range={range}
                interval={interval}
              />
            ))}
          </div>

          {/* Playtime distribution for engagement */}
          {category === 'engagement' && selectedGameId && (
            <PlaytimeDistribution gameId={selectedGameId} range={range} />
          )}
        </>
      )}
    </div>
  );
}
