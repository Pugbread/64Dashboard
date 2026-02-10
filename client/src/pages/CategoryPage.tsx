import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Radio } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { useCategoryStats, TimeSeriesResult } from '../hooks/useStats';
import { useCCU } from '../hooks/useCCU';
import GameSelector from '../components/GameSelector';
import Dropdown from '../components/Dropdown';
import TimeSeriesChart from '../components/TimeSeriesChart';

const RANGE_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

const INTERVAL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  '1m':  [{ value: '1m', label: '1 Minute' }],
  '5m':  [{ value: '5m', label: '5 Minutes' }],
  '30m': [{ value: '30m', label: '30 Minutes' }],
  '1h':  [{ value: '1h', label: '1 Hour' }],
  '3h':  [{ value: '3h', label: '3 Hours' }],
  '7h':  [{ value: '7h', label: '7 Hours' }],
  '1d':  [{ value: '1d', label: '1 Day' }],
};

const INTERVAL_AVAILABILITY: Record<string, string[]> = {
  '1h':  ['1m', '5m', '30m'],
  '6h':  ['5m', '30m', '1h', '3h'],
  '24h': ['30m', '1h', '3h', '7h'],
  '3d':  ['30m', '1h', '3h', '7h', '1d'],
  '7d':  ['1h', '3h', '7h', '1d'],
  '30d': ['3h', '7h', '1d'],
};

const DEFAULT_INTERVALS: Record<string, string> = {
  '1h': '1m', '6h': '5m', '24h': '1h', '3d': '3h', '7d': '1d', '30d': '1d',
};

const CATEGORY_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  revenue: 'Revenue',
  retention: 'Retention',
};

interface CategoryPageProps {
  category: string;
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const { games, loading: gamesLoading } = useGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [range, setRange] = useState('7d');
  const [interval, setInterval] = useState(DEFAULT_INTERVALS['7d']);

  const ccu = useCCU(selectedGameId);
  const { data: stats, loading: statsLoading, refetch } = useCategoryStats(selectedGameId, category, range, interval);

  // Auto-select first game
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) setSelectedGameId(games[0].id);
  }, [games, selectedGameId]);

  // When range changes, reset interval to default if current is unavailable
  useEffect(() => {
    const available = INTERVAL_AVAILABILITY[range] || [];
    if (!available.includes(interval)) {
      setInterval(DEFAULT_INTERVALS[range] || available[0]);
    }
  }, [range]);

  const availableIntervals = (INTERVAL_AVAILABILITY[range] || []).flatMap(
    (iv) => INTERVAL_OPTIONS[iv] || []
  );

  const label = CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);

  if (gamesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-text-muted" size={18} />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity size={24} className="text-text-muted mb-4" />
        <p className="text-white text-base font-semibold">No games added yet</p>
        <p className="text-text-muted text-sm mt-1">Go to Games to add your first game</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">{label}</h2>
          {/* CCU badge — only on engagement */}
          {category === 'engagement' && (
            <div className="flex items-center gap-1.5 border border-border rounded-[3px] px-2.5 py-1">
              <Radio size={10} className="text-status-success" />
              <span className="text-xs font-mono text-white">{ccu.toLocaleString()}</span>
              <span className="text-[10px] text-text-muted">online</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GameSelector games={games} selectedGameId={selectedGameId} onSelect={setSelectedGameId} />
          <Dropdown value={range} options={RANGE_OPTIONS} onChange={setRange} />
          <Dropdown value={interval} options={availableIntervals} onChange={setInterval} />
          <button
            onClick={refetch}
            disabled={statsLoading}
            className="p-2 rounded-[3px] text-text-muted hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50 border border-border"
          >
            <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {statsLoading && !stats && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-text-muted" size={18} />
        </div>
      )}

      {/* Charts */}
      {stats && stats.providers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {stats.providers.map((provider) => {
            const result = stats.metrics[provider.id] as TimeSeriesResult | undefined;
            if (!result) return null;
            return (
              <TimeSeriesChart
                key={provider.id}
                provider={provider}
                result={result}
                interval={stats.interval}
              />
            );
          })}
        </div>
      )}

      {/* Empty */}
      {stats && Object.keys(stats.metrics).length === 0 && (
        <div className="card p-12 text-center">
          <Activity size={28} className="mx-auto text-text-muted mb-3" />
          <p className="text-white font-semibold">No data yet</p>
          <p className="text-text-muted text-sm mt-1">Start sending events from your game</p>
        </div>
      )}
    </div>
  );
}
