import { NavLink } from 'react-router-dom';
import { BarChart3, Gamepad2, LogOut, Users, DollarSign, TrendingUp, Layers } from 'lucide-react';

interface SidebarProps {
  categories: string[];
  onLogout: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  engagement: <Users size={15} strokeWidth={1.5} />,
  revenue: <DollarSign size={15} strokeWidth={1.5} />,
  retention: <TrendingUp size={15} strokeWidth={1.5} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  revenue: 'Revenue',
  retention: 'Retention',
};

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] || <Layers size={15} strokeWidth={1.5} />;
}

function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function Sidebar({ categories, onLogout }: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-[3px] text-[13px] font-medium transition-colors duration-150 ${
      isActive
        ? 'bg-white text-black'
        : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
    }`;

  return (
    <aside className="w-[220px] h-screen bg-bg-primary border-r border-border flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] bg-white flex items-center justify-center">
            <BarChart3 size={14} className="text-black" />
          </div>
          <h1 className="text-[14px] font-bold text-white tracking-tight">64Dashboard</h1>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-5">
        {/* Analytics — one link per category */}
        <div>
          <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Analytics
          </p>
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <NavLink key={cat} to={`/${cat}`} className={linkClass}>
                {getCategoryIcon(cat)}
                {getCategoryLabel(cat)}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Management */}
        <div>
          <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Management
          </p>
          <div className="space-y-0.5">
            <NavLink to="/games" className={linkClass}>
              <Gamepad2 size={15} strokeWidth={1.5} />
              Games
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-[3px] text-[13px] font-medium text-text-secondary hover:text-status-error hover:bg-status-error-bg transition-colors duration-150 w-full"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
