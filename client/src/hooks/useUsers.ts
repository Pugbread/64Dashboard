import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../api/client';

export interface UserEntry {
  playerId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  hasVerifiedBadge: boolean;
  joins: number;
  playtimeSeconds: number;
  lastSeen: string;
}

export interface UsersResponse {
  users: UserEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserSort = 'playtime' | 'name' | 'joins';

export function useUsers(
  gameId: string | null,
  page: number = 1,
  search: string = '',
  verified: boolean = false,
  sort: UserSort = 'playtime'
) {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const { data: resp } = await getUsers(gameId, page, 25, search, verified, sort);
      setData(resp);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [gameId, page, search, verified, sort]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading };
}
