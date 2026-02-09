import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
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

  // Auto-select first game
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  if (gamesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-surface-400" size={24} />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-surface-400 text-lg">No games added yet</p>
        <p className="text-surface-500 text-sm mt-2">
          Go to the Games page to add your first game
        </p>
      </div>
    );
  }

  // Separate scalar and timeseries providers
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
        <div className="flex items-center gap-4">
          <GameSelector
            games={games}
            selectedGameId={selectedGameId}
            onSelect={setSelectedGameId}
          />
          <RangeSelector value={range} onChange={setRange} />
        </div>
        <button
          onClick={refetch}
          disabled={statsLoading}
          className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors disabled:opacity-50"
          title="Refresh stats"
        >
          <RefreshCw size={18} className={statsLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading state */}
      {statsLoading && !stats && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-surface-400" size={24} />
        </div>
      )}

      {/* KPI Cards */}
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

      {/* Empty state when no data */}
      {stats && scalarProviders.length === 0 && timeseriesProviders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-surface-400 text-lg">No data yet</p>
          <p className="text-surface-500 text-sm mt-2">
            Start sending events from your Roblox game to see analytics
          </p>
        </div>
      )}
    </div>
  );
}
