import { NavLink } from 'react-router-dom';
import { BarChart3, Gamepad2, LogOut, LayoutDashboard } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
      isActive
        ? 'bg-gradient-purple text-white shadow-glow-sm'
        : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
    }`;

  return (
    <aside className="w-[240px] h-screen bg-bg-primary border-r border-border/50 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center shadow-glow-sm">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-tight">
              64Dashboard
            </h1>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-6">
        <div>
          <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Main
          </p>
          <div className="space-y-1">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard size={18} strokeWidth={1.5} />
              Dashboard
            </NavLink>
          </div>
        </div>

        <div>
          <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            Management
          </p>
          <div className="space-y-1">
            <NavLink to="/games" className={linkClass}>
              <Gamepad2 size={18} strokeWidth={1.5} />
              Games
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-4 py-5 border-t border-border/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:text-status-error hover:bg-status-error-bg transition-all duration-200 w-full"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
