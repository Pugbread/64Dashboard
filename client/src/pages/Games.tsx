import { useState } from 'react';
import { Plus, Trash2, Gamepad2 } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import AddGameModal from '../components/AddGameModal';

export default function Games() {
  const { games, loading, addGame, deleteGame } = useGames();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Games</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage tracked Roblox games</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} />
          Add Game
        </button>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm py-12 text-center">Loading games...</div>
      ) : games.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="relative z-10">
            <Gamepad2 size={36} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary text-sm font-medium">No games added yet</p>
            <p className="text-text-muted text-xs mt-1">Click "Add Game" to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <div key={game.id} className="card card-hover p-4 flex items-center gap-4">
              <div className="relative z-10 flex items-center gap-4 w-full">
                {game.icon_url ? (
                  <img src={game.icon_url} alt={game.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center">
                    <Gamepad2 size={20} className="text-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{game.name}</p>
                  <p className="text-text-muted text-[10px] font-mono mt-0.5 truncate">{game.id}</p>
                </div>
                <button
                  onClick={() => { if (confirm(`Delete "${game.name}"?`)) deleteGame(game.id); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error-bg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddGameModal onAdd={addGame} onClose={() => setShowModal(false)} />}
    </div>
  );
}
