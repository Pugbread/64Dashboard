import { useState } from 'react';
import { BarChart3, Lock } from 'lucide-react';
import { login } from '../api/client';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await login(password);
      onLogin(data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-[4px] bg-white mx-auto mb-4 flex items-center justify-center">
            <BarChart3 size={20} className="text-black" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">64Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Roblox Analytics</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="input-field pl-9"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="text-status-error text-xs bg-status-error-bg px-3 py-2 rounded-[3px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
