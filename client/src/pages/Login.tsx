import { useState, FormEvent } from 'react';
import { BarChart3, ArrowRight } from 'lucide-react';

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
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[380px] px-6 sm:px-0">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[14px] bg-gradient-accent flex items-center justify-center mx-auto mb-5 shadow-glow-strong">
            <BarChart3 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">64 Analytics</h1>
          <p className="text-text-muted text-sm mt-1.5">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-7 space-y-5">
          <div className="relative z-10 space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="input-field"
                autoFocus
              />
            </div>
            {error && (
              <div className="px-3 py-2 rounded-btn bg-status-danger-bg border border-status-danger/20">
                <p className="text-status-danger text-xs font-medium">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-text-muted text-[11px] mt-6">Roblox Analytics Dashboard</p>
      </div>
    </div>
  );
}
