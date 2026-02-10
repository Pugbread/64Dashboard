import { NavLink } from 'react-router-dom';
import { BarChart3, Gamepad2, LogOut, Users, DollarSign, TrendingUp, Layers, Settings } from 'lucide-react';

interface SidebarProps {
  categories: string[];
  onLogout: () => void;
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

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] || <Layers size={18} strokeWidth={1.5} />;
}
function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function Sidebar({ categories, onLogout }: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-btn text-[13px] transition-all duration-200 ${
      isActive
        ? 'font-semibold text-white bg-gradient-active border border-accent/20 shadow-glow'
        : 'font-medium text-text-secondary hover:text-white hover:bg-white/[0.03]'
    }`;

  return (
    <aside className="w-[240px] h-screen bg-bg-primary border-r border-border flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-gradient-accent flex items-center justify-center shadow-glow">
            <BarChart3 size={16} className="text-white" />
          </div>
          <h1 className="text-[15px] font-bold text-white tracking-tight">64's Dash</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-7 overflow-y-auto">
        {/* MAIN */}
        <div>
          <p className="category-label px-3 mb-3">Main</p>
          <div className="space-y-1">
            {categories.map((cat) => (
              <NavLink key={cat} to={`/${cat}`} className={linkClass}>
                {getCategoryIcon(cat)}
                {getCategoryLabel(cat)}
              </NavLink>
            ))}
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
