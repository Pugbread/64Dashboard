import { useState, useEffect } from 'react';
import { useUsers, UserEntry, UserSort } from '../hooks/useUsers';
import { Pagination } from '../components/ProductBreakdown';
import { Search, User, BadgeCheck, ArrowUpDown, ChevronLeft, ChevronRight, Clock, LogIn } from 'lucide-react';

interface Props {
  selectedGameId: string | null;
}

function formatPlaytime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  if (hours < 24) return `${hours}h ${remainMin}m`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return `${days}d ${remainHours}h`;
}

function formatPlaytimeFull(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  return parts.join(', ');
}

function formatLastSeen(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function UsersPage({ selectedGameId }: Props) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<UserSort>('playtime');

  const { data, loading } = useUsers(selectedGameId, page, search, verifiedOnly, sort);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedGameId, verifiedOnly, sort]);

  if (!selectedGameId) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-text-secondary text-[13px] mt-1">Player index</p>
        </div>
        <div className="card p-16 text-center">
          <div className="relative z-10 text-text-secondary text-sm">Select a game to view users</div>
        </div>
      </div>
    );
  }

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const sortBtn = (field: UserSort, label: string) => (
    <button
      onClick={() => setSort(field)}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
        sort === field ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {label}
      <ArrowUpDown size={10} className={sort === field ? 'opacity-100' : 'opacity-40'} />
    </button>
  );

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Users</h1>
        <p className="text-text-secondary text-[13px] mt-1">Player index</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by username or player ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-btn pl-9 pr-4 py-2.5 text-white text-[13px] placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>

        {/* Verified filter */}
        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-btn text-[13px] font-medium transition-all duration-200 border ${
            verifiedOnly
              ? 'bg-accent/10 border-accent/30 text-accent shadow-glow'
              : 'bg-bg-card border-border text-text-secondary hover:text-white hover:border-border'
          }`}
        >
          <BadgeCheck size={15} />
          Verified only
        </button>

        {/* Total count */}
        <span className="text-text-muted text-[12px] font-medium ml-auto">
          {total.toLocaleString()} user{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="relative z-10">
          {/* Sort header */}
          <div className="px-6 sm:px-7 pt-5 pb-3 flex items-center gap-6">
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mr-1">Sort by:</span>
            {sortBtn('playtime', 'Playtime')}
            {sortBtn('joins', 'Joins')}
            {sortBtn('name', 'Name')}
          </div>

          {loading && users.length === 0 ? (
            <div className="px-7 pb-8 pt-4 text-text-muted text-sm text-center">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="px-7 pb-8 pt-4 text-text-muted text-sm text-center">
              {search || verifiedOnly ? 'No users match your filters' : 'No users found'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-t border-b border-border">
                      <th className="px-6 sm:px-7 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Player</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
                        <span className="inline-flex items-center gap-1"><Clock size={10} /> Playtime</span>
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
                        <span className="inline-flex items-center gap-1"><LogIn size={10} /> Joins</span>
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right pr-6 sm:pr-7">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.playerId} className={`border-b border-border/50 transition-colors hover:bg-white/[0.02] ${i === users.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-6 sm:px-7 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-full bg-bg-elevated overflow-hidden border border-border">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><User size={14} className="text-text-muted" /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white text-[13px] font-medium truncate">{u.displayName}</span>
                                {u.hasVerifiedBadge && (
                                  <BadgeCheck size={14} className="text-accent shrink-0" />
                                )}
                              </div>
                              <p className="text-text-muted text-[11px] truncate">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className="text-white text-[13px] font-semibold cursor-default"
                            title={formatPlaytimeFull(u.playtimeSeconds)}
                          >
                            {formatPlaytime(u.playtimeSeconds)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3.5 text-right">
                          <span className="text-text-secondary text-[13px] font-medium">{u.joins.toLocaleString()}</span>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3.5 text-right pr-6 sm:pr-7">
                          <span className="text-text-muted text-[12px]" title={new Date(u.lastSeen).toLocaleString()}>
                            {formatLastSeen(u.lastSeen)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 sm:px-7 py-3 border-t border-border">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-[11px] text-text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
