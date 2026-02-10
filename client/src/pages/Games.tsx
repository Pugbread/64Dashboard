import { useState } from 'react';
import { Plus, Trash2, Gamepad2, Calendar, Hash, Globe } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import AddGameModal from '../components/AddGameModal';

export default function Games() {
  const { games, loading, addGame, deleteGame } = useGames();
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this game and all its analytics data?')) return;
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
          <h2 className="text-lg font-semibold text-white">Games</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage tracked games</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} />
          Add Game
        </button>
      </div>

      {/* Games */}
      {loading ? (
        <div className="text-text-muted text-center py-16 text-sm">Loading...</div>
      ) : games.length === 0 ? (
        <div className="card p-16 text-center">
          <Gamepad2 size={24} className="mx-auto text-text-muted mb-3" />
          <p className="text-white font-semibold">No games yet</p>
          <p className="text-text-muted text-sm mt-1 mb-4">Add your first game to start tracking</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {games.map((game) => (
            <div key={game.id} className="card card-hover group">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {game.icon_url ? (
                      <img
                        src={game.icon_url}
                        alt={game.name}
                        className="w-10 h-10 rounded-[3px] object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-[3px] bg-bg-elevated border border-border flex items-center justify-center">
                        <Gamepad2 size={16} className="text-text-muted" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-[14px]">{game.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                        <Calendar size={10} />
                        {new Date(game.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(game.id)}
                    disabled={deletingId === game.id}
                    className="p-1.5 rounded-[2px] text-text-muted hover:text-status-error hover:bg-status-error-bg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Metadata */}
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Hash size={10} className="text-text-muted" />
                    <span className="text-text-muted">ID:</span>
                    <span className="text-text-secondary font-mono">{game.id.slice(0, 12)}...</span>
                  </div>
                  {game.universe_id && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Globe size={10} className="text-text-muted" />
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
