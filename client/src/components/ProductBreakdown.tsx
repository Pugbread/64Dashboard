import { Package, ShoppingBag, Trophy, ArrowUp, ArrowDown, ArrowUpDown, User, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductEntry } from '../hooks/useProductBreakdown';
import { SpenderEntry } from '../hooks/useTopSpenders';

export type ProductSort = 'revenue' | 'sales' | 'avgSession' | 'avgPlaytime' | 'repeat';
export type SpenderSort = 'spent' | 'purchases';
export type SortDir = 'desc' | 'asc';

export function formatRobux(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return `R$ ${value.toLocaleString()}`;
}

export function formatRobuxFull(value: number): string {
  return `R$ ${value.toLocaleString()}`;
}

const TOWER_GRADIENTS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
  'from-blue-400 to-blue-500',
  'from-blue-400/70 to-blue-500/70',
  'from-indigo-400 to-indigo-500',
  'from-teal-400 to-teal-500',
  'from-purple-400 to-purple-500',
  'from-rose-400 to-rose-500',
  'from-emerald-400 to-emerald-500',
];

const TOWER_SHADOWS = [
  '0 0 24px rgba(250,204,21,0.15)',
  '0 0 16px rgba(203,213,225,0.08)',
  '0 0 16px rgba(217,119,6,0.10)',
  '0 0 12px rgba(59,130,246,0.10)',
  '0 0 12px rgba(96,165,250,0.08)',
  '0 0 10px rgba(99,102,241,0.08)',
  '0 0 10px rgba(45,212,191,0.08)',
  '0 0 10px rgba(168,85,247,0.08)',
  '0 0 10px rgba(251,113,133,0.08)',
  '0 0 10px rgba(52,211,153,0.08)',
];

const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

/* ─── Product towers ─── */

const SORT_LABELS: Record<ProductSort, string> = {
  revenue: 'revenue',
  sales: 'sales count',
  avgSession: 'avg session time',
  avgPlaytime: 'avg total playtime',
  repeat: 'repeat spender rate',
};

export function getProductValue(p: ProductEntry, field: ProductSort): number {
  switch (field) {
    case 'sales': return p.sales;
    case 'avgSession': return p.avgSessionMin ?? 0;
    case 'avgPlaytime': return p.avgTotalPlaytimeMin ?? 0;
    case 'repeat': return p.repeatSpenderRate ?? 0;
    default: return p.revenue;
  }
}

function formatProductValue(val: number, field: ProductSort): string {
  switch (field) {
    case 'sales': return val.toLocaleString();
    case 'avgSession': return `${val.toFixed(1)}m`;
    case 'avgPlaytime': return `${val.toFixed(1)}m`;
    case 'repeat': return `${val}%`;
    default: return formatRobux(val);
  }
}

export function ProductTowers({ products, sortField }: { products: ProductEntry[]; sortField: ProductSort }) {
  const top = products.slice(0, 10);
  if (top.length === 0) return null;

  const getValue = (p: ProductEntry) => getProductValue(p, sortField);
  const maxVal = Math.max(...top.map(getValue), 1);

  return (
    <div className="card p-6 sm:p-7 flex-1 min-w-0">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Trophy size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">
            Top {top.length} Products
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-8">
          By {SORT_LABELS[sortField] || 'revenue'}
        </p>

        <div className="overflow-x-auto -mx-6 sm:-mx-7 px-6 sm:px-7">
          <div className="flex items-end justify-center gap-1 sm:gap-2 h-[200px] sm:h-[260px] px-1 min-w-[300px]">
            {top.map((product, i) => {
              const val = getValue(product);
              const heightPct = Math.max((val / maxVal) * 100, 8);
              return (
                <div key={product.productId} className="flex flex-col items-center flex-1 max-w-[60px] h-full justify-end">
                  <p className="text-white text-[8px] sm:text-[10px] font-bold mb-1 text-center whitespace-nowrap cursor-default" title={val.toLocaleString()}>
                    {formatProductValue(val, sortField)}
                  </p>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border mb-1 z-10">
                    {product.iconUrl ? (
                      <img src={product.iconUrl} alt={product.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={10} className="text-text-muted" /></div>
                    )}
                  </div>
                  <div
                    className={`w-full rounded-t-[3px] bg-gradient-to-t ${TOWER_GRADIENTS[i] || TOWER_GRADIENTS[9]} transition-all duration-700 ease-out relative`}
                    style={{ height: `${heightPct}%`, boxShadow: TOWER_SHADOWS[i] || TOWER_SHADOWS[9] }}
                  >
                    {i < 5 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <span className="text-[8px] font-bold text-black/60">{RANK_LABELS[i]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-1 sm:gap-2 mt-2 px-1 min-w-[300px]">
            {top.map((product) => (
              <div key={product.productId} className="flex-1 max-w-[60px] text-center">
                <p className="text-text-secondary text-[8px] sm:text-[9px] font-medium truncate">{product.productName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Spender towers ─── */

export function SpenderTowers({ spenders, sortField }: { spenders: SpenderEntry[]; sortField: SpenderSort }) {
  const top = spenders.slice(0, 10);
  if (top.length === 0) return null;

  const getValue = (s: SpenderEntry) => (sortField === 'spent' ? s.spent : s.purchases);
  const maxVal = Math.max(...top.map(getValue), 1);

  return (
    <div className="card p-6 sm:p-7 flex-1 min-w-0">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Crown size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">
            Top {top.length} Spenders
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-8">
          By {sortField === 'spent' ? 'robux spent' : 'purchase count'}
        </p>

        <div className="overflow-x-auto -mx-6 sm:-mx-7 px-6 sm:px-7">
          <div className="flex items-end justify-center gap-1 sm:gap-2 h-[200px] sm:h-[260px] px-1 min-w-[300px]">
            {top.map((spender, i) => {
              const val = getValue(spender);
              const heightPct = Math.max((val / maxVal) * 100, 8);
              return (
                <div key={spender.playerId} className="flex flex-col items-center flex-1 max-w-[60px] h-full justify-end">
                  <p className="text-white text-[8px] sm:text-[10px] font-bold mb-1 text-center whitespace-nowrap cursor-default" title={val.toLocaleString()}>
                    {sortField === 'spent' ? formatRobux(val) : val.toLocaleString()}
                  </p>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full bg-bg-elevated overflow-hidden border border-border mb-1 z-10">
                    {spender.avatarUrl ? (
                      <img src={spender.avatarUrl} alt={spender.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User size={10} className="text-text-muted" /></div>
                    )}
                  </div>
                  <div
                    className={`w-full rounded-t-[3px] bg-gradient-to-t ${TOWER_GRADIENTS[i] || TOWER_GRADIENTS[9]} transition-all duration-700 ease-out relative`}
                    style={{ height: `${heightPct}%`, boxShadow: TOWER_SHADOWS[i] || TOWER_SHADOWS[9] }}
                  >
                    {i < 5 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <span className="text-[8px] font-bold text-black/60">{RANK_LABELS[i]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-1 sm:gap-2 mt-2 px-1 min-w-[300px]">
            {top.map((spender) => (
              <div key={spender.playerId} className="flex-1 max-w-[60px] text-center">
                <p className="text-text-secondary text-[8px] sm:text-[9px] font-medium truncate">{spender.displayName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pagination controls ─── */

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 sm:px-7 py-3 border-t border-border">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} /> Prev
      </button>
      <span className="text-[11px] text-text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ─── Product table ─── */

function formatMinutes(mins: number | null): string {
  if (mins === null || mins === undefined) return '—';
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins.toFixed(1)}m`;
  const h = Math.floor(mins / 60);
  const rm = Math.round(mins % 60);
  return `${h}h ${rm}m`;
}

function formatMinutesFull(mins: number | null): string {
  if (mins === null || mins === undefined) return 'No data';
  return `${mins.toFixed(1)} minutes`;
}

export function ProductTable({ products, sortField, sortDir, onSortChange, page, totalPages, onPageChange }: { products: ProductEntry[]; sortField: ProductSort; sortDir: SortDir; onSortChange: (f: ProductSort) => void; page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (products.length === 0) return null;
  const sorted = [...products].sort((a, b) => {
    const diff = getProductValue(b, sortField) - getProductValue(a, sortField);
    return sortDir === 'asc' ? -diff : diff;
  });

  const sortIcon = (field: ProductSort) => {
    if (sortField !== field) return <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50" />;
    return sortDir === 'desc'
      ? <ArrowDown size={10} className="opacity-100" />
      : <ArrowUp size={10} className="opacity-100" />;
  };

  const thBtn = (field: ProductSort, label: string) => (
    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors group text-right whitespace-nowrap" onClick={() => onSortChange(field)}>
      <span className={`inline-flex items-center gap-1 ${sortField === field ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`}>
        {label}
        {sortIcon(field)}
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
                <th className="px-3 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Type</th>
                {thBtn('revenue', 'Revenue')}
                {thBtn('sales', 'Sales')}
                {thBtn('avgSession', 'Avg Session')}
                {thBtn('avgPlaytime', 'Avg Playtime')}
                {thBtn('repeat', 'Repeat %')}
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
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-pill ${p.productType === 'gamepass' ? 'bg-purple-500/10 text-purple-400' : 'bg-accent/10 text-accent-light'}`}>
                      {p.productType === 'gamepass' ? 'Gamepass' : 'DevProduct'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right"><span className="text-white text-[13px] font-semibold cursor-default" title={formatRobuxFull(p.revenue)}>{formatRobux(p.revenue)}</span></td>
                  <td className="px-3 py-3.5 text-right"><span className="text-text-secondary text-[13px] font-medium cursor-default" title={p.sales.toLocaleString()}>{p.sales.toLocaleString()}</span></td>
                  <td className="px-3 py-3.5 text-right">
                    <span className="text-text-secondary text-[12px] font-medium cursor-default" title={formatMinutesFull(p.avgSessionMin)}>
                      {formatMinutes(p.avgSessionMin)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className="text-text-secondary text-[12px] font-medium cursor-default" title={formatMinutesFull(p.avgTotalPlaytimeMin)}>
                      {formatMinutes(p.avgTotalPlaytimeMin)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right pr-6 sm:pr-7">
                    {p.repeatSpenderRate !== null ? (
                      <span className={`text-[12px] font-semibold cursor-default ${p.repeatSpenderRate >= 50 ? 'text-green-400' : p.repeatSpenderRate >= 25 ? 'text-yellow-400' : 'text-text-secondary'}`} title={`${p.repeatSpenderRate}% of buyers purchased again`}>
                        {p.repeatSpenderRate}%
                      </span>
                    ) : (
                      <span className="text-text-muted text-[12px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

/* ─── Spender table ─── */

export function SpenderTable({ spenders, sortField, sortDir, onSortChange, page, totalPages, onPageChange }: { spenders: SpenderEntry[]; sortField: SpenderSort; sortDir: SortDir; onSortChange: (f: SpenderSort) => void; page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (spenders.length === 0) return null;
  const sorted = [...spenders].sort((a, b) => {
    const diff = (sortField === 'spent' ? b.spent - a.spent : b.purchases - a.purchases);
    return sortDir === 'asc' ? -diff : diff;
  });

  const sortIcon = (field: SpenderSort) => {
    if (sortField !== field) return <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50" />;
    return sortDir === 'desc'
      ? <ArrowDown size={10} className="opacity-100" />
      : <ArrowUp size={10} className="opacity-100" />;
  };

  const thBtn = (field: SpenderSort, label: string) => (
    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors group text-right" onClick={() => onSortChange(field)}>
      <span className={`inline-flex items-center gap-1 ${sortField === field ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`}>
        {label}
        {sortIcon(field)}
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
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
