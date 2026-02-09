import { useState } from 'react';
import { X } from 'lucide-react';

interface AddGameModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, iconUrl?: string) => Promise<void>;
}

export default function AddGameModal({ open, onClose, onAdd }: AddGameModalProps) {
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
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
      await onAdd(name.trim(), iconUrl.trim() || undefined);
      setName('');
      setIconUrl('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Game</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              Game Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Game"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder-surface-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              Icon URL <span className="text-surface-500">(optional)</span>
            </label>
            <input
              type="url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder-surface-500"
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
