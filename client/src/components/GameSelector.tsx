import { ChevronDown } from 'lucide-react';
import { Game } from '../hooks/useGames';

interface GameSelectorProps {
  games: Game[];
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
}

export default function GameSelector({ games, selectedGameId, onSelect }: GameSelectorProps) {
  return (
    <div className="relative">
      <select
        value={selectedGameId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none bg-surface-800 border border-surface-700 text-white text-sm rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent cursor-pointer min-w-[200px]"
      >
        <option value="" disabled>
          Select a game
        </option>
        {games.map((game) => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
      />
    </div>
  );
}
