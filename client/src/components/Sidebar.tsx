import { NavLink } from 'react-router-dom';
import { BarChart3, Gamepad2, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-accent/10 text-accent-light'
        : 'text-surface-400 hover:text-white hover:bg-surface-800'
    }`;

  return (
    <aside className="w-64 h-screen bg-surface-900 border-r border-surface-800 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-800">
        <h1 className="text-xl font-bold text-white tracking-tight">
          <span className="text-accent-light">64</span>Dashboard
        </h1>
        <p className="text-xs text-surface-500 mt-1">Roblox Analytics</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink to="/" end className={linkClass}>
          <BarChart3 size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/games" className={linkClass}>
          <Gamepad2 size={18} />
          Games
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-surface-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
