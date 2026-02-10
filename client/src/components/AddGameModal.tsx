import { useState } from 'react';
import { X, Gamepad2 } from 'lucide-react';

interface AddGameModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, universeId?: string, iconUrl?: string) => Promise<void>;
}

export default function AddGameModal({ open, onClose, onAdd }: AddGameModalProps) {
  const [name, setName] = useState('');
  const [universeId, setUniverseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Game name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAdd(name.trim(), universeId.trim() || undefined);
      setName('');
      setUniverseId('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-0 w-full max-w-md shadow-2xl border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple-glow flex items-center justify-center">
              <Gamepad2 size={16} className="text-accent-purple" />
            </div>
            <h2 className="text-[15px] font-semibold text-white">Add Game</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Game Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Game"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Universe ID <span className="text-text-muted normal-case">(auto-fetches icon from Roblox)</span>
            </label>
            <input
              type="text"
              value={universeId}
              onChange={(e) => setUniverseId(e.target.value)}
              placeholder="e.g. 1234567890"
              className="input-field font-mono"
            />
          </div>

          {error && (
            <div className="pill-error text-xs px-3 py-2 w-full justify-center rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
