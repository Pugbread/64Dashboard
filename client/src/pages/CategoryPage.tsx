import { useState, useEffect } from 'react';
import { Range, Interval, ProviderMeta } from '../hooks/useStats';
import { useCCU } from '../hooks/useCCU';
import { useMeta } from '../hooks/useMeta';
import Dropdown from '../components/Dropdown';
import LazyChart from '../components/LazyChart';
import ProductBreakdown from '../components/ProductBreakdown';
import { Users } from 'lucide-react';

const RANGE_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
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

export default function CategoryPage({ category, selectedGameId }: CategoryPageProps) {
  const [range, setRange] = useState<Range>('24h');
  const [interval, setInterval] = useState<Interval>('1h');
  const { meta } = useMeta();
  const ccu = useCCU(category === 'engagement' ? selectedGameId : null);

  // Get providers for this category from meta
  const providers: ProviderMeta[] = meta
    ? meta.providers.filter((p) => p.category === category)
    : [];

  useEffect(() => {
    const available = getAvailableIntervals(range);
    if (!available.find((a) => a.value === interval)) {
      setInterval((DEFAULT_INTERVAL[range] || available[0]?.value || '1h') as Interval);
    }
  }, [range]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          {CATEGORY_LABELS[category] || category}
        </h1>
        <p className="text-text-secondary text-[13px] mt-1">Analytics overview</p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Dropdown value={range} options={RANGE_OPTIONS} onChange={(v) => setRange(v as Range)} />
          <Dropdown value={interval} options={getAvailableIntervals(range)} onChange={(v) => setInterval(v as Interval)} />
        </div>
      </div>

      {/* CCU banner */}
      {category === 'engagement' && ccu !== null && (
        <div className="card p-5 flex items-center gap-4">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-btn bg-accent-muted flex items-center justify-center">
              <Users size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">Concurrent Users</p>
              <p className="text-white text-2xl font-bold tracking-tight">{ccu.toLocaleString()}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse ml-1" />
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
            {providers.map((p) => (
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

          {/* Product breakdown for revenue category */}
          {category === 'revenue' && (
            <ProductBreakdown gameId={selectedGameId} range={range} />
          )}
        </>
      )}
    </div>
  );
}
