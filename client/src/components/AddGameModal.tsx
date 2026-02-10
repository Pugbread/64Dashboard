import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  onAdd: (name: string, iconUrl?: string, universeId?: string) => Promise<void>;
  onClose: () => void;
}

export default function AddGameModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [universeId, setUniverseId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim(), iconUrl.trim() || undefined, universeId.trim() || undefined);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Add Game</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Game Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Roblox Game" className="input-field" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Universe ID</label>
              <input value={universeId} onChange={(e) => setUniverseId(e.target.value)} placeholder="e.g. 123456789" className="input-field" />
              <p className="text-[10px] text-text-muted mt-1.5">For auto-fetching icon &amp; live CCU</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Icon URL</label>
              <input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="Leave blank to auto-fetch" className="input-field" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">{loading ? 'Adding...' : 'Add Game'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
