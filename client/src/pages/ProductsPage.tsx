import { useState, useEffect } from 'react';
import { useProductBreakdown, ProductEntry } from '../hooks/useProductBreakdown';
import { ProductTowers, ProductTable, ProductSort, SortDir, getProductValue } from '../components/ProductBreakdown';
import Dropdown from '../components/Dropdown';
import { Package } from 'lucide-react';

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

export default function ProductsPage({ selectedGameId }: Props) {
  const [range, setRange] = useState('24h');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<ProductSort>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { data, loading } = useProductBreakdown(selectedGameId, range, page);

  const handleSortChange = (field: ProductSort) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Cache top 10 from page 1 for towers
  const [top5, setTop5] = useState<ProductEntry[]>([]);

  useEffect(() => {
    if (data && page === 1 && data.products.length > 0) {
      setTop5([...data.products].sort((a, b) => b.revenue - a.revenue).slice(0, 10));
    }
  }, [data, page]);

  // Reset page when range or game changes
  useEffect(() => { setPage(1); }, [selectedGameId, range]);

  if (!selectedGameId) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Products</h1>
          <p className="text-text-secondary text-[13px] mt-1">Product breakdown</p>
        </div>
        <div className="card p-16 text-center">
          <div className="relative z-10 text-text-secondary text-sm">Select a game to view products</div>
        </div>
      </div>
    );
  }

  const sortedTower = [...top5].sort((a, b) => {
    const diff = getProductValue(b, sortField) - getProductValue(a, sortField);
    return sortDir === 'asc' ? -diff : diff;
  });
  const totalPages = data?.totalPages ?? 1;
  const hasData = (data && data.products.length > 0) || top5.length > 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Products</h1>
        <p className="text-text-secondary text-[13px] mt-1">Product breakdown</p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Dropdown value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
      </div>

      {loading && !hasData && (
        <div className="text-text-secondary text-sm py-8 text-center">Loading products...</div>
      )}

      {!loading && !hasData && (
        <div className="card p-10 text-center">
          <div className="relative z-10">
            <Package size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary text-sm font-medium">No product sales in this period</p>
          </div>
        </div>
      )}

      {hasData && (
        <div className="space-y-5">
          {sortedTower.length > 0 && <ProductTowers products={sortedTower} sortField={sortField} />}
          {data && data.products.length > 0 && (
            <ProductTable
              products={data.products}
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
