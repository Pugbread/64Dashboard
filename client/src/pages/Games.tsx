import { useState } from 'react';
import { Plus, Trash2, Gamepad2, Calendar, Hash, Globe } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import AddGameModal from '../components/AddGameModal';

export default function Games() {
  const { games, loading, addGame, deleteGame } = useGames();
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? All analytics data for this game will be permanently deleted.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteGame(id);
    } catch (err) {
      console.error('Failed to delete game:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Games</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage your tracked Roblox games</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Game
        </button>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="text-text-muted text-center py-16">Loading...</div>
      ) : games.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-accent-purple-glow mx-auto mb-5 flex items-center justify-center">
              <Gamepad2 size={28} className="text-accent-purple" />
            </div>
            <p className="text-white text-lg font-semibold">No games yet</p>
            <p className="text-text-secondary text-sm mt-2 max-w-xs mx-auto">
              Add your first Roblox game to start tracking analytics
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-5">
              Add Game
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <div key={game.id} className="card card-hover group">
              <div className="relative z-10 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {game.icon_url ? (
                      <img
                        src={game.icon_url}
                        alt={game.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center">
                        <Gamepad2 size={20} className="text-text-muted" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-[15px]">{game.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-1">
                        <Calendar size={11} />
                        {new Date(game.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(game.id)}
                    disabled={deletingId === game.id}
                    className="p-2 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error-bg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete game"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Metadata */}
                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Hash size={11} className="text-text-muted" />
                    <span className="text-text-muted">ID:</span>
                    <span className="text-text-secondary font-mono">{game.id.slice(0, 12)}...</span>
                  </div>
                  {game.universe_id && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Globe size={11} className="text-text-muted" />
                      <span className="text-text-muted">Universe:</span>
                      <span className="text-text-secondary font-mono">{game.universe_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddGameModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={async (name, universeId) => {
          await addGame(name, universeId);
        }}
      />
    </div>
  );
}
