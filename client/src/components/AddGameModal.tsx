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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="card p-0 w-full max-w-md border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Gamepad2 size={16} className="text-text-muted" />
            <h2 className="text-[14px] font-semibold text-white">Add Game</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
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
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
              Universe ID <span className="normal-case text-text-muted">(auto-fetches icon)</span>
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
            <div className="text-status-error text-xs bg-status-error-bg px-3 py-2 rounded-[3px]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[3px] text-sm font-medium text-text-secondary hover:text-white transition-colors"
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
