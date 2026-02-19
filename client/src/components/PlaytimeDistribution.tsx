import { usePlaytimeDistribution, CurvePoint, Percentiles } from '../hooks/usePlaytimeDistribution';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Clock, TrendingUp, Users, BarChart3 } from 'lucide-react';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

interface Props {
  gameId: string | null;
  range: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return `${h}h ${rm}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}d ${rh}h`;
}

function formatDurationFull(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function PercentileBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted text-[11px] font-mono font-semibold w-8 text-right shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-bg-elevated rounded-[4px] overflow-hidden relative">
        <div
          className="h-full rounded-[4px] transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/80 cursor-default"
          title={formatDurationFull(value)}
        >
          {formatDuration(value)}
        </span>
      </div>
    </div>
  );
}

function LorenzTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border rounded-btn px-3 py-2 shadow-lg">
      <p className="text-[11px] text-text-muted">
        Bottom <span className="text-white font-semibold">{d.playerPct}%</span> of players
      </p>
      <p className="text-[11px] text-text-muted">
        Account for <span className="text-accent font-semibold">{d.playtimePct}%</span> of playtime
      </p>
    </div>
  );
}

function Insight({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-btn bg-bg-elevated/80 border border-border">
      <div className={`shrink-0 ${accent ? 'text-accent' : 'text-text-muted'}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-text-muted text-[9px] font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-[13px] font-bold ${accent ? 'text-accent' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function PlaytimeDistribution({ gameId, range }: Props) {
  const { data, loading } = usePlaytimeDistribution(gameId, range);

  if (!gameId) return null;

  if (loading) {
    return (
      <div className="card p-6 col-span-1 xl:col-span-2">
        <div className="relative z-10 h-[300px] flex items-center justify-center">
          <div className="w-full max-w-md h-4 bg-bg-elevated rounded-btn animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || data.totalPlayers === 0) {
    return (
      <div className="card p-10 text-center col-span-1 xl:col-span-2">
        <div className="relative z-10">
          <BarChart3 size={24} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary text-sm font-medium">No playtime data in this period</p>
        </div>
      </div>
    );
  }

  const { percentiles, curve, totalPlayers, totalPlaytimeSeconds, topTenPercent, topOnePercent } = data;
  const maxPerc = percentiles.p99;

  const barColors = [
    'rgba(59,130,246,0.20)',
    'rgba(59,130,246,0.30)',
    'rgba(59,130,246,0.42)',
    'rgba(59,130,246,0.55)',
    'rgba(59,130,246,0.70)',
    'rgba(59,130,246,0.90)',
  ];

  return (
    <div className="card p-6 col-span-1 xl:col-span-2">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-1">
          <TrendingUp size={15} className="text-accent" />
          <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">
            Playtime Distribution
          </p>
        </div>
        <p className="text-text-muted text-[10px] mb-5">
          How playtime is spread across your player base
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <Insight
            icon={<Users size={14} />}
            label="Players"
            value={totalPlayers.toLocaleString()}
          />
          <Insight
            icon={<Clock size={14} />}
            label="Median (P50)"
            value={formatDuration(percentiles.p50)}
          />
          <Insight
            icon={<TrendingUp size={14} />}
            label="Top 10% carry"
            value={`${topTenPercent}%`}
            accent
          />
          <Insight
            icon={<BarChart3 size={14} />}
            label="Top 1% carry"
            value={`${topOnePercent}%`}
            accent
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider mb-3">
              Concentration Curve
            </p>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="lorenzFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="playerPct"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(v: number) => `${v}%`}
                    axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(v: number) => `${v}%`}
                    axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<LorenzTooltip />} />
                  <ReferenceLine
                    segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Area
                    type="monotone"
                    dataKey="playtimePct"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#lorenzFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#3B82F6', stroke: '#f8fafc', strokeWidth: 2 }}
                    isAnimationActive={!isMobile}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-text-muted text-[9px] mt-2 text-center">
              The further the curve bows from the diagonal, the more concentrated playtime is among top players
            </p>
          </div>

          <div>
            <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider mb-3">
              Percentile Playtime
            </p>
            <div className="space-y-2">
              <PercentileBar label="P10" value={percentiles.p10} maxValue={maxPerc} color={barColors[0]} />
              <PercentileBar label="P25" value={percentiles.p25} maxValue={maxPerc} color={barColors[1]} />
              <PercentileBar label="P50" value={percentiles.p50} maxValue={maxPerc} color={barColors[2]} />
              <PercentileBar label="P75" value={percentiles.p75} maxValue={maxPerc} color={barColors[3]} />
              <PercentileBar label="P90" value={percentiles.p90} maxValue={maxPerc} color={barColors[4]} />
              <PercentileBar label="P99" value={percentiles.p99} maxValue={maxPerc} color={barColors[5]} />
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Total Playtime</span>
                <span className="text-white font-semibold cursor-default" title={formatDurationFull(totalPlaytimeSeconds)}>
                  {formatDuration(totalPlaytimeSeconds)}
                </span>
              </div>
              <p className="text-text-muted text-[9px] mt-2">
                P10 = bottom 10% player &middot; P90 = top 10% player &middot; P99 = top 1% player
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
