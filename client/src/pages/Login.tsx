import { useState, FormEvent } from 'react';
import { BarChart3 } from 'lucide-react';

interface LoginProps { onLogin: (token: string) => void }

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid password');
      onLogin(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-blue/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-accent-blue/[0.04] rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-blue flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
            <BarChart3 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">64's Dash</h1>
          <p className="text-text-secondary text-sm mt-1.5">Roblox Analytics Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-7 space-y-5">
          <div className="relative z-10 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="input-field"
                autoFocus
              />
            </div>
            {error && <p className="text-status-error text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
