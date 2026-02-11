import { useState } from 'react';
import { useProductBreakdown, ProductEntry } from '../hooks/useProductBreakdown';
import { useTopSpenders, SpenderEntry } from '../hooks/useTopSpenders';
import { Package, ShoppingBag, Trophy, ArrowUpDown, User, Crown } from 'lucide-react';

interface Props {
  gameId: string | null;
  range: string;
}

type ProductSort = 'revenue' | 'sales';
type SpenderSort = 'spent' | 'purchases';

function formatRobux(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return `R$ ${value.toLocaleString()}`;
}

function formatRobuxFull(value: number): string {
  return `R$ ${value.toLocaleString()}`;
}

const TOWER_GRADIENTS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
  'from-blue-400 to-blue-500',
  'from-blue-400/70 to-blue-500/70',
];

const TOWER_SHADOWS = [
  '0 0 24px rgba(250,204,21,0.15)',
  '0 0 16px rgba(203,213,225,0.08)',
  '0 0 16px rgba(217,119,6,0.10)',
  '0 0 12px rgba(59,130,246,0.10)',
  '0 0 12px rgba(96,165,250,0.08)',
];

const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th'];

/* ─── Product towers ─── */

function ProductTowers({ products, sortField }: { products: ProductEntry[]; sortField: ProductSort }) {
  const top5 = products.slice(0, 5);
  if (top5.length === 0) return null;

  const getValue = (p: ProductEntry) => (sortField === 'revenue' ? p.revenue : p.sales);
  const maxVal = Math.max(...top5.map(getValue), 1);

  return (
    <div className="card p-6 sm:p-7 flex-1 min-w-0">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Trophy size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">
            Top {top5.length} Products
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-8">
          By {sortField === 'revenue' ? 'revenue' : 'sales count'}
        </p>

        <div className="flex items-end justify-center gap-2 sm:gap-4 h-[200px] sm:h-[240px] px-1">
          {top5.map((product, i) => {
            const val = getValue(product);
            const heightPct = Math.max((val / maxVal) * 100, 8);
            return (
              <div key={product.productId} className="flex flex-col items-center flex-1 max-w-[80px] h-full justify-end">
                <p className="text-white text-[10px] sm:text-[12px] font-bold mb-1.5 text-center whitespace-nowrap cursor-default" title={sortField === 'revenue' ? formatRobuxFull(val) : val.toLocaleString()}>
                  {sortField === 'revenue' ? formatRobux(val) : val.toLocaleString()}
                </p>
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border mb-1 z-10">
                  {product.iconUrl ? (
                    <img src={product.iconUrl} alt={product.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={12} className="text-text-muted" /></div>
                  )}
                </div>
                <div
                  className={`w-full rounded-t-[3px] bg-gradient-to-t ${TOWER_GRADIENTS[i] || TOWER_GRADIENTS[4]} transition-all duration-700 ease-out relative`}
                  style={{ height: `${heightPct}%`, boxShadow: TOWER_SHADOWS[i] || TOWER_SHADOWS[4] }}
                >
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-bold text-black/60">{RANK_LABELS[i]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 sm:gap-4 mt-2.5 px-1">
          {top5.map((product) => (
            <div key={product.productId} className="flex-1 max-w-[80px] text-center">
              <p className="text-text-secondary text-[9px] sm:text-[10px] font-medium truncate">{product.productName}</p>
              <p className="text-text-muted text-[8px] sm:text-[9px] mt-0.5">
                {sortField === 'revenue' ? `${product.sales.toLocaleString()} sales` : formatRobux(product.revenue)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Spender towers ─── */

function SpenderTowers({ spenders, sortField }: { spenders: SpenderEntry[]; sortField: SpenderSort }) {
  const top5 = spenders.slice(0, 5);
  if (top5.length === 0) return null;

  const getValue = (s: SpenderEntry) => (sortField === 'spent' ? s.spent : s.purchases);
  const maxVal = Math.max(...top5.map(getValue), 1);

  return (
    <div className="card p-6 sm:p-7 flex-1 min-w-0">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Crown size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">
            Top {top5.length} Spenders
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-8">
          By {sortField === 'spent' ? 'robux spent' : 'purchase count'}
        </p>

        <div className="flex items-end justify-center gap-2 sm:gap-4 h-[200px] sm:h-[240px] px-1">
          {top5.map((spender, i) => {
            const val = getValue(spender);
            const heightPct = Math.max((val / maxVal) * 100, 8);
            return (
              <div key={spender.playerId} className="flex flex-col items-center flex-1 max-w-[80px] h-full justify-end">
                <p className="text-white text-[10px] sm:text-[12px] font-bold mb-1.5 text-center whitespace-nowrap cursor-default" title={sortField === 'spent' ? formatRobuxFull(val) : val.toLocaleString()}>
                  {sortField === 'spent' ? formatRobux(val) : val.toLocaleString()}
                </p>
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-bg-elevated overflow-hidden border border-border mb-1 z-10">
                  {spender.avatarUrl ? (
                    <img src={spender.avatarUrl} alt={spender.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User size={12} className="text-text-muted" /></div>
                  )}
                </div>
                <div
                  className={`w-full rounded-t-[3px] bg-gradient-to-t ${TOWER_GRADIENTS[i] || TOWER_GRADIENTS[4]} transition-all duration-700 ease-out relative`}
                  style={{ height: `${heightPct}%`, boxShadow: TOWER_SHADOWS[i] || TOWER_SHADOWS[4] }}
                >
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-bold text-black/60">{RANK_LABELS[i]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 sm:gap-4 mt-2.5 px-1">
          {top5.map((spender) => (
            <div key={spender.playerId} className="flex-1 max-w-[80px] text-center">
              <p className="text-text-secondary text-[9px] sm:text-[10px] font-medium truncate">{spender.displayName}</p>
              <p className="text-text-muted text-[8px] sm:text-[9px] mt-0.5">
                {sortField === 'spent' ? `${spender.purchases.toLocaleString()} buys` : formatRobux(spender.spent)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Product table ─── */

function ProductTable({ products, sortField, onSortChange }: { products: ProductEntry[]; sortField: ProductSort; onSortChange: (f: ProductSort) => void }) {
  if (products.length === 0) return null;
  const sorted = [...products].sort((a, b) => sortField === 'revenue' ? b.revenue - a.revenue : b.sales - a.sales);

  const thBtn = (field: ProductSort, label: string) => (
    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors group text-right" onClick={() => onSortChange(field)}>
      <span className={`inline-flex items-center gap-1 ${sortField === field ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`}>
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
                <th className="px-6 sm:px-7 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Type</th>
                {thBtn('revenue', 'Revenue')}
                {thBtn('sales', 'Sales')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.productId} className={`border-b border-border/50 transition-colors hover:bg-white/[0.02] ${i === sorted.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 sm:px-7 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border">
                        {p.iconUrl ? <img src={p.iconUrl} alt={p.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={12} className="text-text-muted" /></div>}
                      </div>
                      <span className="text-white text-[13px] font-medium truncate">{p.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-pill ${p.productType === 'gamepass' ? 'bg-purple-500/10 text-purple-400' : 'bg-accent/10 text-accent-light'}`}>
                      {p.productType === 'gamepass' ? 'Gamepass' : 'DevProduct'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right"><span className="text-white text-[13px] font-semibold cursor-default" title={formatRobuxFull(p.revenue)}>{formatRobux(p.revenue)}</span></td>
                  <td className="px-4 py-3.5 text-right pr-6 sm:pr-7"><span className="text-text-secondary text-[13px] font-medium cursor-default" title={p.sales.toLocaleString()}>{p.sales.toLocaleString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Spender table ─── */

function SpenderTable({ spenders, sortField, onSortChange }: { spenders: SpenderEntry[]; sortField: SpenderSort; onSortChange: (f: SpenderSort) => void }) {
  if (spenders.length === 0) return null;
  const sorted = [...spenders].sort((a, b) => sortField === 'spent' ? b.spent - a.spent : b.purchases - a.purchases);

  const thBtn = (field: SpenderSort, label: string) => (
    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors group text-right" onClick={() => onSortChange(field)}>
      <span className={`inline-flex items-center gap-1 ${sortField === field ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`}>
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
            <Crown size={16} className="text-accent" />
            <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">All Spenders</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-b border-border">
                <th className="px-6 sm:px-7 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Player</th>
                {thBtn('spent', 'Robux Spent')}
                {thBtn('purchases', 'Purchases')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.playerId} className={`border-b border-border/50 transition-colors hover:bg-white/[0.02] ${i === sorted.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 sm:px-7 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-bg-elevated overflow-hidden border border-border">
                        {s.avatarUrl ? <img src={s.avatarUrl} alt={s.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={12} className="text-text-muted" /></div>}
                      </div>
                      <span className="text-white text-[13px] font-medium truncate">{s.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right"><span className="text-white text-[13px] font-semibold cursor-default" title={formatRobuxFull(s.spent)}>{formatRobux(s.spent)}</span></td>
                  <td className="px-4 py-3.5 text-right pr-6 sm:pr-7"><span className="text-text-secondary text-[13px] font-medium cursor-default" title={s.purchases.toLocaleString()}>{s.purchases.toLocaleString()}</span></td>
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
  const { data: productData, loading: productLoading } = useProductBreakdown(gameId, range);
  const { data: spenderData, loading: spenderLoading } = useTopSpenders(gameId, range);
  const [productSort, setProductSort] = useState<ProductSort>('revenue');
  const [spenderSort, setSpenderSort] = useState<SpenderSort>('spent');

  if (!gameId) return null;

  const loading = productLoading || spenderLoading;
  const hasProducts = productData && productData.products.length > 0;
  const hasSpenders = spenderData && spenderData.spenders.length > 0;

  if (loading && !hasProducts && !hasSpenders) {
    return <div className="text-text-secondary text-sm py-8 text-center">Loading breakdown...</div>;
  }

  if (!hasProducts && !hasSpenders) {
    return (
      <div className="card p-10 text-center">
        <div className="relative z-10">
          <ShoppingBag size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary text-sm font-medium">No product sales in this period</p>
        </div>
      </div>
    );
  }

  const sortedProducts = hasProducts
    ? [...productData.products].sort((a, b) => productSort === 'revenue' ? b.revenue - a.revenue : b.sales - a.sales)
    : [];

  const sortedSpenders = hasSpenders
    ? [...spenderData.spenders].sort((a, b) => spenderSort === 'spent' ? b.spent - a.spent : b.purchases - a.purchases)
    : [];

  return (
    <div className="space-y-5">
      {/* Tower charts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {hasProducts && <ProductTowers products={sortedProducts} sortField={productSort} />}
        {hasSpenders && <SpenderTowers spenders={sortedSpenders} sortField={spenderSort} />}
      </div>

      {/* Tables side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {hasProducts && <ProductTable products={productData.products} sortField={productSort} onSortChange={setProductSort} />}
        {hasSpenders && <SpenderTable spenders={spenderData.spenders} sortField={spenderSort} onSortChange={setSpenderSort} />}
      </div>
    </div>
  );
}
