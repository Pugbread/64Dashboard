import { useState, useEffect, useRef } from 'react';
import { getCCU } from '../api/client';

export function useCCU(gameId: string | null, pollMs = 10_000) {
  const [ccu, setCcu] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!gameId) { setCcu(0); setError(null); return; }

    const fetchCcu = () => {
      getCCU(gameId)
        .then(({ data }) => { setCcu(data.ccu ?? 0); setError(null); })
        .catch((err) => { setError(err?.message || 'Failed to fetch CCU'); });
    };

    fetchCcu();
    timer.current = setInterval(fetchCcu, pollMs);
    return () => clearInterval(timer.current);
  }, [gameId, pollMs]);

  return { ccu, error };
}
