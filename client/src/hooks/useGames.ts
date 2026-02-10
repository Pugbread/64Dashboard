import { useState, useEffect, useCallback } from 'react';
import { getGames, addGame as addGameApi, deleteGame as deleteGameApi } from '../api/client';

export interface Game {
  id: string;
  name: string;
  universe_id: string | null;
  icon_url: string | null;
  created_at: string;
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getGames();
      setGames(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, []);

  const addGame = useCallback(async (name: string, universeId?: string, iconUrl?: string) => {
    const { data } = await addGameApi(name, universeId, iconUrl);
    setGames((prev) => [data, ...prev]);
    return data;
  }, []);

  const deleteGame = useCallback(async (id: string) => {
    await deleteGameApi(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, loading, error, addGame, deleteGame, refetch: fetchGames };
}
