import { useState, useEffect } from 'react';
import { RefreshCw, Activity, DollarSign, Users, Layers, TrendingUp } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { useStats, ProviderMeta, ScalarResult, TimeSeriesResult } from '../hooks/useStats';
import GameSelector from '../components/GameSelector';
import RangeSelector from '../components/RangeSelector';
import IntervalSelector from '../components/IntervalSelector';
import StatCard from '../components/StatCard';
import TimeSeriesChart from '../components/TimeSeriesChart';

/** Category display config. Add new categories here. */
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  engagement: {
    label: 'Engagement',
    icon: <Users size={14} />,
  },
  revenue: {
    label: 'Revenue',
    icon: <DollarSign size={14} />,
  },
  retention: {
    label: 'Retention',
    icon: <TrendingUp size={14} />,
  },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || {
    label: category.charAt(0).toUpperCase() + category.slice(1),
    icon: <Layers size={14} />,
  };
}

interface CategorySection {
  category: string;
  scalars: Array<{ provider: ProviderMeta; result: ScalarResult }>;
  timeseries: Array<{ provider: ProviderMeta; result: TimeSeriesResult }>;
}

export default function Dashboard() {
  const { games, loading: gamesLoading } = useGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [range, setRange] = useState('7d');
  const [interval, setInterval] = useState('daily');
  const { data: stats, loading: statsLoading, refetch } = useStats(selectedGameId, range, interval);

  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  if (gamesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-text-muted" size={20} />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity size={24} className="text-text-muted mb-4" />
        <p className="text-white text-base font-semibold">No games added yet</p>
        <p className="text-text-muted text-sm mt-1">
          Go to Games to add your first game
        </p>
      </div>
    );
  }

  // Group providers by category
  const categorySections: CategorySection[] = [];

  if (stats) {
    const categoryOrder = stats.categories || [];
    const categoryMap = new Map<string, CategorySection>();

    for (const cat of categoryOrder) {
      categoryMap.set(cat, { category: cat, scalars: [], timeseries: [] });
    }

    for (const provider of stats.providers) {
      const result = stats.metrics[provider.id];
      if (!result) continue;

      if (!categoryMap.has(provider.category)) {
        categoryMap.set(provider.category, { category: provider.category, scalars: [], timeseries: [] });
      }

      const section = categoryMap.get(provider.category)!;
      if (result.type === 'scalar') {
        section.scalars.push({ provider, result: result as ScalarResult });
      } else {
        section.timeseries.push({ provider, result: result as TimeSeriesResult });
      }
    }

    for (const cat of categoryMap.keys()) {
      const section = categoryMap.get(cat)!;
      if (section.scalars.length > 0 || section.timeseries.length > 0) {
        categorySections.push(section);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-text-muted mt-0.5">Analytics overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GameSelector games={games} selectedGameId={selectedGameId} onSelect={setSelectedGameId} />
          <RangeSelector value={range} onChange={setRange} />
          <IntervalSelector value={interval} onChange={setInterval} />
          <button
            onClick={refetch}
            disabled={statsLoading}
            className="p-2 rounded-[3px] text-text-muted hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50 border border-border"
            title="Refresh"
          >
            <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {statsLoading && !stats && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-text-muted" size={20} />
        </div>
      )}

      {/* Category Sections */}
      {categorySections.map((section) => {
        const config = getCategoryConfig(section.category);

        return (
          <div key={section.category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-2.5">
              <span className="text-text-muted">{config.icon}</span>
              <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">
                {config.label}
              </h3>
              <div className="flex-1 h-px bg-border ml-1" />
            </div>

            {/* Scalar KPI Cards */}
            {section.scalars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {section.scalars.map(({ provider, result }) => (
                  <StatCard key={provider.id} provider={provider} result={result} />
                ))}
              </div>
            )}

            {/* Time Series Charts */}
            {section.timeseries.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {section.timeseries.map(({ provider, result }) => (
                  <TimeSeriesChart key={provider.id} provider={provider} result={result} interval={interval} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty data state */}
      {stats && categorySections.length === 0 && (
        <div className="card p-12 text-center">
          <Activity size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-white font-semibold">No data yet</p>
          <p className="text-text-muted text-sm mt-1">
            Start sending events from your Roblox game
          </p>
        </div>
      )}
    </div>
  );
}
