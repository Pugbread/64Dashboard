import { useState, useEffect, useCallback } from 'react';
import { getPlaytimeDistribution } from '../api/client';

export interface Percentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p99: number;
}

export interface CurvePoint {
  playerPct: number;
  playtimePct: number;
}

export interface PlaytimeDistributionData {
  percentiles: Percentiles;
  curve: CurvePoint[];
  totalPlayers: number;
  totalPlaytimeSeconds: number;
  topTenPercent: number;
  topOnePercent: number;
  range: string;
  from: string;
  to: string;
}

export function usePlaytimeDistribution(gameId: string | null, range: string) {
  const [data, setData] = useState<PlaytimeDistributionData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const { data: resp } = await getPlaytimeDistribution(gameId, range);
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
