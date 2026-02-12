import { useState, useEffect } from 'react';
import { useTopSpenders, SpenderEntry } from '../hooks/useTopSpenders';
import { SpenderTowers, SpenderTable, SpenderSort, SortDir } from '../components/ProductBreakdown';
import Dropdown from '../components/Dropdown';
import { Crown } from 'lucide-react';

const RANGE_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

interface Props {
  selectedGameId: string | null;
}

export default function SpendersPage({ selectedGameId }: Props) {
  const [range, setRange] = useState('24h');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SpenderSort>('spent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { data, loading } = useTopSpenders(selectedGameId, range, page);

  const handleSortChange = (field: SpenderSort) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Cache top 10 from page 1 for towers
  const [top5, setTop5] = useState<SpenderEntry[]>([]);

  useEffect(() => {
    if (data && page === 1 && data.spenders.length > 0) {
      setTop5([...data.spenders].sort((a, b) => b.spent - a.spent).slice(0, 10));
    }
  }, [data, page]);

  // Reset page when range or game changes
  useEffect(() => { setPage(1); }, [selectedGameId, range]);

  if (!selectedGameId) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Top Spenders</h1>
          <p className="text-text-secondary text-[13px] mt-1">Player spending breakdown</p>
        </div>
        <div className="card p-16 text-center">
          <div className="relative z-10 text-text-secondary text-sm">Select a game to view spenders</div>
        </div>
      </div>
    );
  }

  const sortedTower = [...top5].sort((a, b) => {
    const diff = sortField === 'spent' ? b.spent - a.spent : b.purchases - a.purchases;
    return sortDir === 'asc' ? -diff : diff;
  });
  const totalPages = data?.totalPages ?? 1;
  const hasData = (data && data.spenders.length > 0) || top5.length > 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Top Spenders</h1>
        <p className="text-text-secondary text-[13px] mt-1">Player spending breakdown</p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Dropdown value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>

      {loading && !hasData && (
        <div className="text-text-secondary text-sm py-8 text-center">Loading spenders...</div>
      )}

      {!loading && !hasData && (
        <div className="card p-10 text-center">
          <div className="relative z-10">
            <Crown size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary text-sm font-medium">No spender data in this period</p>
          </div>
        </div>
      )}

      {hasData && (
        <div className="space-y-5">
          {sortedTower.length > 0 && <SpenderTowers spenders={sortedTower} sortField={sortField} />}
          {data && data.spenders.length > 0 && (
            <SpenderTable
              spenders={data.spenders}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
