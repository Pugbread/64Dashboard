import { useState, useEffect, useCallback } from 'react';
import { getTopSpenders } from '../api/client';

export interface SpenderEntry {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  spent: number;
  purchases: number;
}

export interface TopSpendersResponse {
  spenders: SpenderEntry[];
  range: string;
  from: string;
  to: string;
}

export function useTopSpenders(gameId: string | null, range: string) {
  const [data, setData] = useState<TopSpendersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const { data: resp } = await getTopSpenders(gameId, range);
      setData(resp);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [gameId, range]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading };
}
