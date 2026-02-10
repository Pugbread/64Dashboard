import { useState, useEffect } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import { useStats, ProviderMeta, ScalarResult, TimeSeriesResult } from '../hooks/useStats';
import GameSelector from '../components/GameSelector';
import RangeSelector from '../components/RangeSelector';
import StatCard from '../components/StatCard';
import TimeSeriesChart from '../components/TimeSeriesChart';

export default function Dashboard() {
  const { games, loading: gamesLoading } = useGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [range, setRange] = useState('7d');
  const { data: stats, loading: statsLoading, refetch } = useStats(selectedGameId, range);

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

  const scalarProviders: Array<{ provider: ProviderMeta; result: ScalarResult }> = [];
  const timeseriesProviders: Array<{ provider: ProviderMeta; result: TimeSeriesResult }> = [];

  if (stats) {
    for (const provider of stats.providers) {
      const result = stats.metrics[provider.id];
      if (!result) continue;
      if (result.type === 'scalar') {
        scalarProviders.push({ provider, result: result as ScalarResult });
      } else {
        timeseriesProviders.push({ provider, result: result as TimeSeriesResult });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-text-muted mt-0.5">Analytics overview for your games</p>
        </div>
        <div className="flex items-center gap-3">
          <GameSelector
            games={games}
            selectedGameId={selectedGameId}
            onSelect={setSelectedGameId}
          />
          <RangeSelector value={range} onChange={setRange} />
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

      {/* Scalar KPI Cards */}
      {scalarProviders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scalarProviders.map(({ provider, result }) => (
            <StatCard key={provider.id} provider={provider} result={result} />
          ))}
        </div>
      )}

      {/* Time Series Charts */}
      {timeseriesProviders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {timeseriesProviders.map(({ provider, result }) => (
            <TimeSeriesChart key={provider.id} provider={provider} result={result} />
          ))}
        </div>
      )}

      {/* Empty data state */}
      {stats && scalarProviders.length === 0 && timeseriesProviders.length === 0 && (
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
