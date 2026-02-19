import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Gamepad2, LogOut, Users, DollarSign, TrendingUp, Layers, ChevronDown, ChevronRight, X, Package, Crown, LayoutDashboard, UserSearch, Radio } from 'lucide-react';
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
  engagement: <Users size={17} strokeWidth={1.6} />,
  revenue: <DollarSign size={17} strokeWidth={1.6} />,
  retention: <TrendingUp size={17} strokeWidth={1.6} />,
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
    { path: '/revenue', label: 'Overview', icon: <LayoutDashboard size={15} strokeWidth={1.6} /> },
    { path: '/revenue/products', label: 'Products', icon: <Package size={15} strokeWidth={1.6} /> },
    { path: '/revenue/spenders', label: 'Spenders', icon: <Crown size={15} strokeWidth={1.6} /> },
    { path: '/revenue/live', label: 'Live', icon: <Radio size={15} strokeWidth={1.6} /> },
  ],
};

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] || <Layers size={17} strokeWidth={1.6} />;
}
function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function Sidebar({ categories, games, selectedGameId, onSelectGame, onLogout, mobileOpen, onMobileClose }: SidebarProps) {
  const selectedGame = games.find((g) => g.id === selectedGameId);
  const location = useLocation();

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
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
    `flex items-center gap-3 px-3 py-2 rounded-btn text-[13px] transition-all duration-200 group ${
      isActive
        ? 'font-semibold text-white bg-accent/[0.08] border border-accent/20'
        : 'font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] border border-transparent'
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded-btn text-[12px] transition-all duration-200 ${
      isActive
        ? 'font-semibold text-white bg-accent/[0.08]'
        : 'font-medium text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
    }`;

  return (
    <aside
      className={`
        w-[252px] h-screen bg-bg-primary/95 border-r border-border flex flex-col fixed left-0 top-0 z-[60]
        lg:backdrop-blur-xl
        transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-accent flex items-center justify-center shadow-glow">
            <BarChart3 size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-white tracking-tight leading-none">64 Analytics</h1>
            <p className="text-[10px] text-text-muted font-medium mt-0.5">Dashboard</p>
          </div>
        </div>
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
      <div className="px-4 pb-4 pt-2">
        <div className="bg-bg-card rounded-card overflow-hidden border border-border">
          <div className="w-full aspect-[2/1] bg-bg-elevated relative overflow-hidden">
            {selectedGame?.icon_url ? (
              <img src={selectedGame.icon_url} alt={selectedGame.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gamepad2 size={24} className="text-text-muted" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent" />
          </div>
          <div className="relative p-2">
            <select
              value={selectedGameId || ''}
              onChange={(e) => onSelectGame(e.target.value)}
              className="appearance-none w-full bg-bg-elevated/80 border border-border rounded-btn px-3 py-2 pr-8 text-white text-xs font-medium focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 cursor-pointer transition-all duration-200 text-center"
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

      <div className="w-full h-px bg-border mx-0" />

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {/* MAIN */}
        <div>
          <p className="category-label px-3 mb-2">Analytics</p>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const subs = SUBCATEGORIES[cat];
              const isOnCat = location.pathname.startsWith(`/${cat}`);

              if (subs) {
                const isExpanded = expanded[cat] || false;
                return (
                  <div key={cat}>
                    <button
                      onClick={() => toggleExpand(cat)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-btn text-[13px] transition-all duration-200 w-full group ${
                        isOnCat
                          ? 'font-semibold text-white bg-accent/[0.08] border border-accent/20'
                          : 'font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span className="flex-1 text-left">{getCategoryLabel(cat)}</span>
                      <ChevronRight
                        size={13}
                        className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'max-h-[200px] opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="ml-4 pl-3 border-l border-border space-y-0.5 py-0.5">
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

              return (
                <NavLink key={cat} to={`/${cat}`} className={linkClass}>
                  {getCategoryIcon(cat)}
                  {getCategoryLabel(cat)}
                </NavLink>
              );
            })}

            <NavLink to="/users" className={linkClass}>
              <UserSearch size={17} strokeWidth={1.6} />
              Users
            </NavLink>
          </div>
        </div>

        {/* ACCOUNT */}
        <div>
          <p className="category-label px-3 mb-2">Account</p>
          <div className="space-y-0.5">
            <NavLink to="/games" className={linkClass}>
              <Gamepad2 size={17} strokeWidth={1.6} />
              Games
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-btn text-[13px] font-medium text-text-secondary hover:text-status-danger hover:bg-status-danger-bg transition-all duration-200 w-full"
        >
          <LogOut size={17} strokeWidth={1.6} />
          Logout
        </button>
      </div>
    </aside>
  );
}
