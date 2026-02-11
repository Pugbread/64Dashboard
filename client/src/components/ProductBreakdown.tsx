import { useProductBreakdown, ProductEntry } from '../hooks/useProductBreakdown';
import { Package, ShoppingBag, Trophy } from 'lucide-react';

interface Props {
  gameId: string | null;
  range: string;
}

function formatRobux(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
  return `R$ ${value.toLocaleString()}`;
}

const RANK_COLORS = [
  'from-yellow-400 to-amber-500',   // #1 — gold
  'from-slate-300 to-slate-400',     // #2 — silver
  'from-amber-600 to-amber-700',     // #3 — bronze
  'from-blue-400 to-blue-500',       // #4
  'from-blue-400/70 to-blue-500/70', // #5
];

const RANK_BG = [
  'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  'bg-slate-300/10 text-slate-300 border-slate-300/20',
  'bg-amber-600/10 text-amber-500 border-amber-600/20',
  'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'bg-blue-400/10 text-blue-400/70 border-blue-400/20',
];

function TopFiveLeaderboard({ products }: { products: ProductEntry[] }) {
  const top5 = products.slice(0, 5);
  if (top5.length === 0) return null;

  const maxRevenue = top5[0].revenue || 1;

  return (
    <div className="card p-6 sm:p-7">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-6">
          <Trophy size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">Top Products</p>
        </div>

        <div className="space-y-3">
          {top5.map((product, i) => {
            const pct = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
            const isFirst = i === 0;

            return (
              <div
                key={product.productId}
                className={`
                  relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-card border transition-all duration-300
                  ${isFirst
                    ? 'bg-bg-elevated border-yellow-400/15 shadow-[0_0_20px_rgba(250,204,21,0.04)]'
                    : 'bg-bg-card border-border hover:border-border-accent/30'
                  }
                `}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Rank badge */}
                <div className={`w-8 h-8 shrink-0 rounded-btn flex items-center justify-center text-xs font-bold border ${RANK_BG[i] || RANK_BG[4]}`}>
                  {i + 1}
                </div>

                {/* Product icon */}
                <div className="w-10 h-10 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border">
                  {product.iconUrl ? (
                    <img src={product.iconUrl} alt={product.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={16} className="text-text-muted" />
                    </div>
                  )}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-medium truncate mb-2">{product.productName}</p>
                  <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${RANK_COLORS[i] || RANK_COLORS[4]} transition-all duration-700 ease-out`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>

                {/* Revenue + sales */}
                <div className="text-right shrink-0">
                  <p className="text-white text-sm font-bold tracking-tight">{formatRobux(product.revenue)}</p>
                  <p className="text-text-muted text-[10px] font-medium mt-0.5">{product.sales.toLocaleString()} sale{product.sales !== 1 ? 's' : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProductTable({ products }: { products: ProductEntry[] }) {
  if (products.length === 0) return null;

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
                <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">Revenue</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right pr-6 sm:pr-7">Sales</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr
                  key={p.productId}
                  className={`border-b border-border/50 transition-colors hover:bg-white/[0.02] ${i === products.length - 1 ? 'border-b-0' : ''}`}
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
                    <span className={`
                      inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-pill
                      ${p.productType === 'gamepass'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-accent/10 text-accent-light'
                      }
                    `}>
                      {p.productType === 'gamepass' ? 'Gamepass' : 'DevProduct'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-white text-[13px] font-semibold">{formatRobux(p.revenue)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right pr-6 sm:pr-7">
                    <span className="text-text-secondary text-[13px] font-medium">{p.sales.toLocaleString()}</span>
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

export default function ProductBreakdown({ gameId, range }: Props) {
  const { data, loading } = useProductBreakdown(gameId, range);

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

  return (
    <div className="space-y-5">
      <TopFiveLeaderboard products={data.products} />
      <ProductTable products={data.products} />
    </div>
  );
}
