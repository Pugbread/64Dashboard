import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Gamepad2, LogOut, Users, DollarSign, TrendingUp, Layers, ChevronDown, ChevronRight, X, Package, Crown, LayoutDashboard, UserSearch } from 'lucide-react';
import { Game } from '../hooks/useGames';

interface SidebarProps {
  categories: string[];
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (id: string) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  engagement: <Users size={18} strokeWidth={1.5} />,
  revenue: <DollarSign size={18} strokeWidth={1.5} />,
  retention: <TrendingUp size={18} strokeWidth={1.5} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  revenue: 'Revenue',
  retention: 'Retention',
};

interface SubCategory {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const SUBCATEGORIES: Record<string, SubCategory[]> = {
  revenue: [
    { path: '/revenue', label: 'Overview', icon: <LayoutDashboard size={16} strokeWidth={1.5} /> },
    { path: '/revenue/products', label: 'Products', icon: <Package size={16} strokeWidth={1.5} /> },
    { path: '/revenue/spenders', label: 'Spenders', icon: <Crown size={16} strokeWidth={1.5} /> },
  ],
};

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] || <Layers size={18} strokeWidth={1.5} />;
}
function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function Sidebar({ categories, games, selectedGameId, onSelectGame, onLogout, mobileOpen, onMobileClose }: SidebarProps) {
  const selectedGame = games.find((g) => g.id === selectedGameId);
  const location = useLocation();

  // Track which expandable categories are open
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Auto-expand if we're already on a sub-route
    const initial: Record<string, boolean> = {};
    for (const cat of Object.keys(SUBCATEGORIES)) {
      if (location.pathname.startsWith(`/${cat}`)) {
        initial[cat] = true;
      }
    }
    return initial;
  });

  const toggleExpand = (cat: string) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-btn text-[13px] transition-all duration-200 ${
      isActive
        ? 'font-semibold text-white bg-gradient-active border border-accent/20 shadow-glow'
        : 'font-medium text-text-secondary hover:text-white hover:bg-white/[0.03]'
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-4 py-2 rounded-btn text-[12px] transition-all duration-200 ${
      isActive
        ? 'font-semibold text-white bg-accent/10 border border-accent/15'
        : 'font-medium text-text-muted hover:text-text-secondary hover:bg-white/[0.02]'
    }`;

  return (
    <aside
      className={`
        w-[240px] h-screen bg-bg-primary border-r border-border flex flex-col fixed left-0 top-0 z-[60]
        transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-gradient-accent flex items-center justify-center shadow-glow">
            <BarChart3 size={16} className="text-white" />
          </div>
          <h1 className="text-[15px] font-bold text-white tracking-tight">64's Dash</h1>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden w-8 h-8 rounded-btn flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Game selector */}
      <div className="px-4 pb-5">
        <div className="bg-bg-card border border-border rounded-card overflow-hidden">
          {/* Game icon — full width, no stretch */}
          <div className="w-full aspect-square bg-bg-elevated">
            {selectedGame?.icon_url ? (
              <img src={selectedGame.icon_url} alt={selectedGame.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad2 size={28} className="text-text-muted" />
              </div>
            )}
          </div>
          {/* Dropdown */}
          <div className="relative p-2.5">
            <select
              value={selectedGameId || ''}
              onChange={(e) => onSelectGame(e.target.value)}
              className="appearance-none w-full bg-bg-elevated border border-border rounded-btn px-3 py-2 pr-8 text-white text-xs font-medium focus:outline-none focus:border-accent/40 cursor-pointer transition-colors text-center"
            >
              <option value="" disabled>Select game</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-7 overflow-y-auto">
        {/* MAIN */}
        <div>
          <p className="category-label px-3 mb-3">Main</p>
          <div className="space-y-1">
            {categories.map((cat) => {
              const subs = SUBCATEGORIES[cat];
              const isOnCat = location.pathname.startsWith(`/${cat}`);

              if (subs) {
                // Collapsible category with subcategories
                const isExpanded = expanded[cat] || false;
                return (
                  <div key={cat}>
                    <button
                      onClick={() => toggleExpand(cat)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-btn text-[13px] transition-all duration-200 w-full ${
                        isOnCat
                          ? 'font-semibold text-white bg-gradient-active border border-accent/20 shadow-glow'
                          : 'font-medium text-text-secondary hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span className="flex-1 text-left">{getCategoryLabel(cat)}</span>
                      <ChevronRight
                        size={14}
                        className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {/* Sub-items */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'max-h-[200px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5">
                        {subs.map((sub) => (
                          <NavLink key={sub.path} to={sub.path} end className={subLinkClass}>
                            {sub.icon}
                            {sub.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular category link
              return (
                <NavLink key={cat} to={`/${cat}`} className={linkClass}>
                  {getCategoryIcon(cat)}
                  {getCategoryLabel(cat)}
                </NavLink>
              );
            })}

            {/* Users — standalone link */}
            <NavLink to="/users" className={linkClass}>
              <UserSearch size={18} strokeWidth={1.5} />
              Users
            </NavLink>
          </div>
        </div>

        {/* ACCOUNT */}
        <div>
          <p className="category-label px-3 mb-3">Account</p>
          <div className="space-y-1">
            <NavLink to="/games" className={linkClass}>
              <Gamepad2 size={18} strokeWidth={1.5} />
              Games
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-4 py-5 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-btn text-[13px] font-medium text-text-secondary hover:text-status-danger hover:bg-status-danger-bg transition-all duration-200 w-full"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
