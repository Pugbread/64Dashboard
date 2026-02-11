import { useState } from 'react';
import { useProductBreakdown, ProductEntry } from '../hooks/useProductBreakdown';
import { Package, ShoppingBag, Trophy, ArrowUpDown } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from 'recharts';

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

const VERTEX_COLORS = [
  '#FACC15', // gold
  '#CBD5E1', // silver
  '#D97706', // bronze
  '#3B82F6', // blue
  '#60A5FA', // light blue
];

/* ─── Radar / Pentagon chart for top 5 ─── */

function TopFiveRadar({ products, sortField }: { products: ProductEntry[]; sortField: SortField }) {
  const top5 = products.slice(0, 5);
  if (top5.length === 0) return null;

  const maxVal = Math.max(...top5.map((p) => (sortField === 'revenue' ? p.revenue : p.sales)), 1);

  const radarData = top5.map((p, i) => ({
    name: p.productName.length > 14 ? p.productName.slice(0, 13) + '...' : p.productName,
    fullName: p.productName,
    value: sortField === 'revenue' ? p.revenue : p.sales,
    normalised: ((sortField === 'revenue' ? p.revenue : p.sales) / maxVal) * 100,
    iconUrl: p.iconUrl,
    rank: i + 1,
    revenue: p.revenue,
    sales: p.sales,
  }));

  return (
    <div className="card p-6 sm:p-7">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Trophy size={16} className="text-yellow-400" />
          <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider">
            Top {top5.length} Products
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-6">
          Sorted by {sortField === 'revenue' ? 'revenue' : 'sales count'}
        </p>

        {/* Radar chart */}
        <div className="w-full max-w-[420px] mx-auto aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid
                stroke="rgba(255,255,255,0.06)"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="name"
                tick={({ x, y, payload, index }: any) => {
                  const entry = radarData[index];
                  const color = VERTEX_COLORS[index] || '#60A5FA';
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        textAnchor="middle"
                        dy={-8}
                        fill={color}
                        fontSize={10}
                        fontWeight={600}
                      >
                        {payload.value}
                      </text>
                      <text
                        textAnchor="middle"
                        dy={6}
                        fill="#64748B"
                        fontSize={9}
                      >
                        {sortField === 'revenue'
                          ? formatRobux(entry?.revenue ?? 0)
                          : `${(entry?.sales ?? 0).toLocaleString()} sales`}
                      </text>
                    </g>
                  );
                }}
              />
              <Radar
                dataKey="normalised"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.15}
                dot={{
                  r: 4,
                  fill: '#3B82F6',
                  stroke: '#080808',
                  strokeWidth: 2,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121214',
                  border: '1px solid #1E1E22',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  padding: '10px 14px',
                }}
                formatter={(_val: any, _name: any, props: any) => {
                  const d = props.payload;
                  return [
                    `${formatRobux(d.revenue)} | ${d.sales.toLocaleString()} sales`,
                    d.fullName,
                  ];
                }}
                labelFormatter={() => ''}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend below chart */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
          {top5.map((p, i) => (
            <div key={p.productId} className="flex items-center gap-2">
              <div className="w-6 h-6 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border">
                {p.iconUrl ? (
                  <img src={p.iconUrl} alt={p.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={10} className="text-text-muted" />
                  </div>
                )}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: VERTEX_COLORS[i] || '#60A5FA' }}
              >
                #{i + 1} {p.productName.length > 18 ? p.productName.slice(0, 17) + '...' : p.productName}
              </span>
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

  // Sort products for the radar chart based on current sort field
  const sortedProducts = [...data.products].sort((a, b) =>
    sortField === 'revenue' ? b.revenue - a.revenue : b.sales - a.sales
  );

  return (
    <div className="space-y-5">
      <TopFiveRadar products={sortedProducts} sortField={sortField} />
      <ProductTable products={data.products} sortField={sortField} onSortChange={setSortField} />
    </div>
  );
}
