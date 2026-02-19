import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import CategoryPage from './pages/CategoryPage';
import ProductsPage from './pages/ProductsPage';
import SpendersPage from './pages/SpendersPage';
import LivePurchasesPage from './pages/LivePurchasesPage';
import UsersPage from './pages/UsersPage';
import Games from './pages/Games';
import TopBar from './components/TopBar';
import { useMeta } from './hooks/useMeta';
import { useGames } from './hooks/useGames';
import { Menu } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogin = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) handleLogout();
      } catch {
        handleLogout();
      }
    }
  }, [token, handleLogout]);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp onLogout={handleLogout} />;
}

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const { meta, loading: metaLoading } = useMeta();
  const { games } = useGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(() => {
    return localStorage.getItem('selectedGameId');
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSelectGame = useCallback((id: string) => {
    setSelectedGameId(id);
    localStorage.setItem('selectedGameId', id);
  }, []);

  useEffect(() => {
    if (games.length === 0) return;
    const savedId = selectedGameId;
    if (savedId && games.find((g) => g.id === savedId)) return;
    handleSelectGame(games[0].id);
  }, [games, selectedGameId, handleSelectGame]);

  if (metaLoading || !meta) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const categories = meta.categories;
  const defaultCategory = categories[0] || 'engagement';

  return (
    <div className="min-h-screen bg-bg-primary relative">
      {/* Atmospheric glow */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-8%] left-[38%] w-[700px] h-[500px] bg-accent/[0.025] rounded-full blur-[180px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[350px] h-[350px] bg-accent/[0.015] rounded-full blur-[140px]" />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-btn flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-[14px] font-bold text-white tracking-tight">64 Analytics</span>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        categories={categories}
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={handleSelectGame}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="lg:ml-[252px] pt-[60px] lg:pt-0 relative z-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="p-4 sm:p-6 lg:p-8 xl:p-10 flex-1">
          <div className="max-w-[1440px] mx-auto">
            <Routes>
              {categories.map((cat) => (
                <Route key={cat} path={`/${cat}`} element={<CategoryPage category={cat} selectedGameId={selectedGameId} />} />
              ))}
              <Route path="/revenue/products" element={<ProductsPage selectedGameId={selectedGameId} />} />
              <Route path="/revenue/spenders" element={<SpendersPage selectedGameId={selectedGameId} />} />
              <Route path="/revenue/live" element={<LivePurchasesPage selectedGameId={selectedGameId} />} />
              <Route path="/users" element={<UsersPage selectedGameId={selectedGameId} />} />
              <Route path="/games" element={<Games />} />
              <Route path="/" element={<Navigate to={`/${defaultCategory}`} replace />} />
              <Route path="*" element={<Navigate to={`/${defaultCategory}`} replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
