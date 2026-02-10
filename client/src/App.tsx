import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import CategoryPage from './pages/CategoryPage';
import Games from './pages/Games';
import { useMeta } from './hooks/useMeta';
import { useGames } from './hooks/useGames';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) handleLogout();
      } catch {
        handleLogout();
      }
    }
  }, []);

  // Not authenticated
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
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Auto-select first game
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  if (metaLoading || !meta) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  const categories = meta.categories;
  const defaultCategory = categories[0] || 'engagement';

  return (
    <div className="min-h-screen bg-bg-primary relative">
      {/* Atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[30%] w-[700px] h-[500px] bg-accent/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[120px]" />
      </div>
      <Sidebar
        categories={categories}
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={setSelectedGameId}
        onLogout={onLogout}
      />
      <main className="ml-[240px] p-8 relative z-10">
        <Routes>
          {categories.map((cat) => (
            <Route key={cat} path={`/${cat}`} element={<CategoryPage category={cat} selectedGameId={selectedGameId} />} />
          ))}
          <Route path="/games" element={<Games />} />
          <Route path="/" element={<Navigate to={`/${defaultCategory}`} replace />} />
          <Route path="*" element={<Navigate to={`/${defaultCategory}`} replace />} />
        </Routes>
      </main>
    </div>
  );
}
