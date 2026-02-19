import { useState, useEffect } from 'react';
import { useProductBreakdown, ProductEntry } from '../hooks/useProductBreakdown';
import { useProductFlows } from '../hooks/useProductFlows';
import { ProductTowers, ProductList, ProductFlows, ProductSort, SortDir, getProductValue } from '../components/ProductBreakdown';
import Dropdown from '../components/Dropdown';
import { Package, ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react';

const RANGE_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

const SORT_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'sales', label: 'Sales' },
  { value: 'avgSession', label: 'Avg Session' },
  { value: 'avgPlaytime', label: 'Avg Playtime' },
  { value: 'repeat', label: 'Repeat %' },
];

interface Props {
  selectedGameId: string | null;
}

export default function ProductsPage({ selectedGameId }: Props) {
  const [range, setRange] = useState('24h');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<ProductSort>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { data, loading } = useProductBreakdown(selectedGameId, range, page);
  const { data: flowsData, loading: flowsLoading } = useProductFlows(selectedGameId, range);

  const [top10, setTop10] = useState<ProductEntry[]>([]);

  useEffect(() => {
    if (data && page === 1 && data.products.length > 0) {
      setTop10([...data.products].sort((a, b) => b.revenue - a.revenue).slice(0, 10));
    }
  }, [data, page]);

  useEffect(() => { setPage(1); }, [selectedGameId, range]);

  if (!selectedGameId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
          <p className="text-text-muted text-[13px] mt-1">Product breakdown and analytics</p>
        </div>
        <div className="card p-16 text-center">
          <div className="relative z-10 text-text-muted text-sm font-medium">Select a game to view products</div>
        </div>
      </div>
    );
  }

  const sortedTower = [...top10].sort((a, b) => {
    const diff = getProductValue(b, sortField) - getProductValue(a, sortField);
    return sortDir === 'asc' ? -diff : diff;
  });
  const totalPages = data?.totalPages ?? 1;
  const hasData = (data && data.products.length > 0) || top10.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
        <p className="text-text-muted text-[13px] mt-1">Product breakdown and analytics</p>
        <div className="flex flex-wrap items-center gap-2.5 mt-5">
          <Dropdown value={range} options={RANGE_OPTIONS} onChange={setRange} />
          <Dropdown
            value={sortField}
            options={SORT_OPTIONS}
            onChange={(v) => { setSortField(v as ProductSort); setSortDir('desc'); }}
          />
          <button
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center justify-center w-9 h-9 rounded-btn bg-bg-card border border-white/[0.04] text-text-secondary hover:text-white transition-colors"
            title={sortDir === 'desc' ? 'Highest first' : 'Lowest first'}
          >
            {sortDir === 'desc'
              ? <ArrowDownNarrowWide size={15} />
              : <ArrowUpNarrowWide size={15} />
            }
          </button>
        </div>
      </div>

      {loading && !hasData && (
        <div className="text-text-muted text-sm py-8 text-center">Loading products...</div>
      )}

      {!loading && !hasData && (
        <div className="card p-10 text-center">
          <div className="relative z-10">
            <Package size={28} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary text-sm font-medium">No product sales in this period</p>
          </div>
        </div>
      )}

      {hasData && (
        <div className="space-y-4">
          <ProductFlows
            flows={flowsData?.flows ?? []}
            totalNewBuyers={flowsData?.totalNewBuyers ?? 0}
            loading={flowsLoading}
          />
          {sortedTower.length > 0 && <ProductTowers products={sortedTower} sortField={sortField} />}
          {data && data.products.length > 0 && (
            <ProductList
              products={data.products}
              sortField={sortField}
              sortDir={sortDir}
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
