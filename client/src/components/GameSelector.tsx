import { ChevronDown } from 'lucide-react';
import { Game } from '../hooks/useGames';

interface GameSelectorProps {
  games: Game[];
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
}

export default function GameSelector({ games, selectedGameId, onSelect }: GameSelectorProps) {
  const selected = games.find((g) => g.id === selectedGameId);

  return (
    <div className="relative">
      <select
        value={selectedGameId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none bg-bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-white text-sm font-medium focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 cursor-pointer min-w-[220px] transition-colors"
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
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
