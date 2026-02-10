import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import CategoryPage from './pages/CategoryPage';
import Games from './pages/Games';
import { useMeta } from './hooks/useMeta';

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
  const { meta, loading } = useMeta();

  if (loading || !meta) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    );
  }

  const categories = meta.categories;
  const defaultCategory = categories[0] || 'engagement';

  return (
    <div className="min-h-screen bg-black">
      <Sidebar categories={categories} onLogout={onLogout} />
      <main className="ml-[220px] p-6">
        <Routes>
          {/* Category pages */}
          {categories.map((cat) => (
            <Route key={cat} path={`/${cat}`} element={<CategoryPage category={cat} />} />
          ))}
          <Route path="/games" element={<Games />} />
          {/* Default redirect to first category */}
          <Route path="/" element={<Navigate to={`/${defaultCategory}`} replace />} />
          <Route path="*" element={<Navigate to={`/${defaultCategory}`} replace />} />
        </Routes>
      </main>
    </div>
  );
}
