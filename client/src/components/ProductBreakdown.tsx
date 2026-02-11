import { useState } from 'react';
import { useProductBreakdown, ProductEntry } from '../hooks/useProductBreakdown';
import { Package, ShoppingBag, Trophy, ArrowUpDown } from 'lucide-react';

interface Props {
  gameId: string | null;
  range: string;
}

type SortField = 'revenue' | 'sales';

function formatRobux(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return `R$ ${value.toLocaleString()}`;
}

function formatRobuxFull(value: number): string {
  return `R$ ${value.toLocaleString()}`;
}

const TOWER_GRADIENTS = [
  'from-yellow-400 to-amber-500',   // #1 gold
  'from-slate-300 to-slate-400',     // #2 silver
  'from-amber-600 to-amber-700',     // #3 bronze
  'from-blue-400 to-blue-500',       // #4
  'from-blue-400/70 to-blue-500/70', // #5
];

const TOWER_SHADOWS = [
  '0 0 24px rgba(250,204,21,0.15)',  // gold glow
  '0 0 16px rgba(203,213,225,0.08)', // silver
  '0 0 16px rgba(217,119,6,0.10)',   // bronze
  '0 0 12px rgba(59,130,246,0.10)',  // blue
  '0 0 12px rgba(96,165,250,0.08)',  // light blue
];

const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th'];

/* ─── Tower chart for top 5 ─── */

function TopFiveTowers({ products, sortField }: { products: ProductEntry[]; sortField: SortField }) {
  const top5 = products.slice(0, 5);
  if (top5.length === 0) return null;

  const getValue = (p: ProductEntry) => (sortField === 'revenue' ? p.revenue : p.sales);
  const maxVal = Math.max(...top5.map(getValue), 1);

  return (
    <div className="card p-6 sm:p-7">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Trophy size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">
            Top {top5.length} Products
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-8">
          Sorted by {sortField === 'revenue' ? 'revenue' : 'sales count'}
        </p>

        {/* Towers container */}
        <div className="flex items-end justify-center gap-3 sm:gap-5 h-[220px] sm:h-[260px] px-2">
          {top5.map((product, i) => {
            const val = getValue(product);
            const heightPct = Math.max((val / maxVal) * 100, 8); // min 8% so it's always visible

            return (
              <div key={product.productId} className="flex flex-col items-center flex-1 max-w-[100px] h-full justify-end">
                {/* Value label above tower */}
                <p
                  className="text-white text-[11px] sm:text-[13px] font-bold mb-2 text-center whitespace-nowrap cursor-default"
                  title={sortField === 'revenue' ? formatRobuxFull(val) : val.toLocaleString()}
                >
                  {sortField === 'revenue' ? formatRobux(val) : val.toLocaleString()}
                </p>

                {/* Product icon on top of tower */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border mb-1.5 z-10">
                  {product.iconUrl ? (
                    <img src={product.iconUrl} alt={product.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={14} className="text-text-muted" />
                    </div>
                  )}
                </div>

                {/* The tower bar */}
                <div
                  className={`w-full rounded-t-[3px] bg-gradient-to-t ${TOWER_GRADIENTS[i] || TOWER_GRADIENTS[4]} transition-all duration-700 ease-out relative`}
                  style={{
                    height: `${heightPct}%`,
                    boxShadow: TOWER_SHADOWS[i] || TOWER_SHADOWS[4],
                  }}
                >
                  {/* Rank badge inside tower */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold text-black/60">{RANK_LABELS[i]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Product names below towers */}
        <div className="flex justify-center gap-3 sm:gap-5 mt-3 px-2">
          {top5.map((product) => (
            <div key={product.productId} className="flex-1 max-w-[100px] text-center">
              <p className="text-text-secondary text-[10px] sm:text-[11px] font-medium truncate">
                {product.productName}
              </p>
              <p className="text-text-muted text-[9px] mt-0.5">
                {sortField === 'revenue'
                  ? `${product.sales.toLocaleString()} sales`
                  : formatRobux(product.revenue)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Full product table with sortable columns ─── */

function ProductTable({
  products,
  sortField,
  onSortChange,
}: {
  products: ProductEntry[];
  sortField: SortField;
  onSortChange: (field: SortField) => void;
}) {
  if (products.length === 0) return null;

  const sorted = [...products].sort((a, b) =>
    sortField === 'revenue' ? b.revenue - a.revenue : b.sales - a.sales
  );

  const thButton = (field: SortField, label: string, align: string) => (
    <th
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors group ${align} ${
        field === 'sales' ? 'pr-6 sm:pr-7' : ''
      }`}
      onClick={() => onSortChange(field)}
    >
      <span
        className={`inline-flex items-center gap-1 ${
          sortField === field ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
        }`}
      >
        {label}
        <ArrowUpDown size={10} className={sortField === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'} />
      </span>
    </th>
  );

  return (
    <div className="card overflow-hidden">
      <div className="relative z-10">
        <div className="px-6 sm:px-7 pt-6 sm:pt-7 pb-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={16} className="text-accent" />
            <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">All Products</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-b border-border">
                <th className="px-6 sm:px-7 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Type
                </th>
                {thButton('revenue', 'Revenue', 'text-right')}
                {thButton('sales', 'Sales', 'text-right')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.productId}
                  className={`border-b border-border/50 transition-colors hover:bg-white/[0.02] ${
                    i === sorted.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-6 sm:px-7 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border">
                        {p.iconUrl ? (
                          <img src={p.iconUrl} alt={p.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={12} className="text-text-muted" />
                          </div>
                        )}
                      </div>
                      <span className="text-white text-[13px] font-medium truncate">{p.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-pill ${
                        p.productType === 'gamepass'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-accent/10 text-accent-light'
                      }`}
                    >
                      {p.productType === 'gamepass' ? 'Gamepass' : 'DevProduct'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-white text-[13px] font-semibold cursor-default" title={formatRobuxFull(p.revenue)}>{formatRobux(p.revenue)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right pr-6 sm:pr-7">
                    <span className="text-text-secondary text-[13px] font-medium cursor-default" title={p.sales.toLocaleString()}>{p.sales.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export default function ProductBreakdown({ gameId, range }: Props) {
  const { data, loading } = useProductBreakdown(gameId, range);
  const [sortField, setSortField] = useState<SortField>('revenue');

  if (!gameId) return null;

  if (loading) {
    return (
      <div className="text-text-secondary text-sm py-8 text-center">Loading product breakdown...</div>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="relative z-10">
          <ShoppingBag size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary text-sm font-medium">No product sales in this period</p>
        </div>
      </div>
    );
  }

  const sortedProducts = [...data.products].sort((a, b) =>
    sortField === 'revenue' ? b.revenue - a.revenue : b.sales - a.sales
  );

  return (
    <div className="space-y-5">
      <TopFiveTowers products={sortedProducts} sortField={sortField} />
      <ProductTable products={data.products} sortField={sortField} onSortChange={setSortField} />
    </div>
  );
}
