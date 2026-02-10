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
        className="appearance-none bg-bg-card border border-border rounded-[3px] px-3 py-2 pr-9 text-white text-sm font-medium focus:outline-none focus:border-[#444] cursor-pointer min-w-[200px] transition-colors"
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
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
