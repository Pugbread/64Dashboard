import { useState, useEffect } from 'react';
import { RefreshCw, Activity, TrendingUp, DollarSign, Users, Layers } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { useStats, ProviderMeta, ScalarResult, TimeSeriesResult } from '../hooks/useStats';
import GameSelector from '../components/GameSelector';
import RangeSelector from '../components/RangeSelector';
import IntervalSelector from '../components/IntervalSelector';
import StatCard from '../components/StatCard';
import TimeSeriesChart from '../components/TimeSeriesChart';

/** Category display config. Add new categories here to customize their appearance. */
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; gradient: string }> = {
  engagement: {
    label: 'Engagement',
    icon: <Users size={16} />,
    color: '#8E54E9',
    gradient: 'from-accent-purple/10 to-transparent',
  },
  revenue: {
    label: 'Revenue',
    icon: <DollarSign size={16} />,
    color: '#4ADE80',
    gradient: 'from-status-success/10 to-transparent',
  },
  retention: {
    label: 'Retention',
    icon: <TrendingUp size={16} />,
    color: '#FF49DB',
    gradient: 'from-accent-pink/10 to-transparent',
  },
};

/** Fallback config for unknown categories */
function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || {
    label: category.charAt(0).toUpperCase() + category.slice(1),
    icon: <Layers size={16} />,
    color: '#8E54E9',
    gradient: 'from-accent-purple/10 to-transparent',
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
        <RefreshCw className="animate-spin text-accent-purple" size={24} />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-purple-glow flex items-center justify-center mb-5">
          <Activity size={28} className="text-accent-purple" />
        </div>
        <p className="text-white text-lg font-semibold">No games added yet</p>
        <p className="text-text-secondary text-sm mt-2 max-w-xs">
          Go to the Games page to add your first game and start tracking analytics
        </p>
      </div>
    );
  }

  // Group providers by category, preserving backend order
  const categorySections: CategorySection[] = [];

  if (stats) {
    const categoryOrder = stats.categories || [];

    // Build a map of category -> providers
    const categoryMap = new Map<string, CategorySection>();
    for (const cat of categoryOrder) {
      categoryMap.set(cat, { category: cat, scalars: [], timeseries: [] });
    }

    for (const provider of stats.providers) {
      const result = stats.metrics[provider.id];
      if (!result) continue;

      // Ensure category section exists (handles new categories not in the order list)
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

    // Build final array in order, only including sections with data
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
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-text-muted mt-0.5">Analytics overview for your games</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <GameSelector
            games={games}
            selectedGameId={selectedGameId}
            onSelect={setSelectedGameId}
          />
          <RangeSelector value={range} onChange={setRange} />
          <IntervalSelector value={interval} onChange={setInterval} />
          <button
            onClick={refetch}
            disabled={statsLoading}
            className="p-2.5 rounded-xl text-text-muted hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-50 border border-border"
            title="Refresh"
          >
            <RefreshCw size={16} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {statsLoading && !stats && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-accent-purple" size={24} />
        </div>
      )}

      {/* Category Sections */}
      {categorySections.map((section) => {
        const config = getCategoryConfig(section.category);

        return (
          <div key={section.category} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${config.color}15`, color: config.color }}
              >
                {config.icon}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white">{config.label}</h3>
                <p className="text-[11px] text-text-muted">
                  {section.scalars.length + section.timeseries.length} metric{section.scalars.length + section.timeseries.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex-1 h-px bg-border/50 ml-2" />
            </div>

            {/* Scalar KPI Cards */}
            {section.scalars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.scalars.map(({ provider, result }) => (
                  <StatCard key={provider.id} provider={provider} result={result} />
                ))}
              </div>
            )}

            {/* Time Series Charts */}
            {section.timeseries.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <div className="relative z-10">
            <Activity size={40} className="mx-auto text-text-muted mb-4" />
            <p className="text-white text-lg font-semibold">No data yet</p>
            <p className="text-text-secondary text-sm mt-2">
              Start sending events from your Roblox game to see analytics
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
