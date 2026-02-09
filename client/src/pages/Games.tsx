import { useState } from 'react';
import { Plus, Trash2, Gamepad2, Calendar } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import AddGameModal from '../components/AddGameModal';

export default function Games() {
  const { games, loading, addGame, deleteGame } = useGames();
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game? All associated data will be lost.')) {
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
          <p className="text-sm text-surface-400 mt-1">
            Manage the games you're tracking analytics for
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-colors"
        >
          <Plus size={16} />
          Add Game
        </button>
      </div>

      {/* Games List */}
      {loading ? (
        <div className="text-surface-400 text-center py-12">Loading...</div>
      ) : games.length === 0 ? (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-12 text-center">
          <Gamepad2 size={48} className="mx-auto text-surface-600 mb-4" />
          <p className="text-surface-400 text-lg">No games yet</p>
          <p className="text-surface-500 text-sm mt-2">
            Add your first game to start tracking analytics
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-colors"
          >
            Add Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-surface-700 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {game.icon_url ? (
                    <img
                      src={game.icon_url}
                      alt={game.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                      <Gamepad2 size={20} className="text-surface-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-medium">{game.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-surface-500 mt-1">
                      <Calendar size={12} />
                      {new Date(game.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(game.id)}
                  disabled={deletingId === game.id}
                  className="p-2 rounded-lg text-surface-500 hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete game"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-800">
                <p className="text-xs text-surface-500 font-mono break-all">ID: {game.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddGameModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={async (name, iconUrl) => {
          await addGame(name, iconUrl);
        }}
      />
    </div>
  );
}
