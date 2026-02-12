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
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  range: string;
  from: string;
  to: string;
}

export function useTopSpenders(gameId: string | null, range: string, page: number = 1) {
  const [data, setData] = useState<TopSpendersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      setError(null);
      const { data: resp } = await getTopSpenders(gameId, range, page, 25);
      setData(resp);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Failed to fetch top spenders');
    } finally {
      setLoading(false);
    }
  }, [gameId, range, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error };
}
