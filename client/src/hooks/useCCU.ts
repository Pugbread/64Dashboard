import { useState, useEffect, useRef } from 'react';
import { getCCU } from '../api/client';

export function useCCU(gameId: string | null, pollMs = 10_000) {
  const [ccu, setCcu] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [allTimeHigh, setAllTimeHigh] = useState<number>(0);
  const [allTimeHighAt, setAllTimeHighAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!gameId) {
      setCcu(0);
      setHistory([]);
      setAllTimeHigh(0);
      setAllTimeHighAt(null);
      setError(null);
      return;
    }

    const fetchCcu = () => {
      getCCU(gameId)
        .then(({ data }) => {
          setCcu(Number(data.ccu ?? 0));
          setHistory(Array.isArray(data.history) ? data.history.map((v: any) => Number(v || 0)) : []);
          setAllTimeHigh(Number(data.allTimeHigh ?? 0));
          setAllTimeHighAt(data.allTimeHighAt ? String(data.allTimeHighAt) : null);
          setError(null);
        })
        .catch((err) => { setError(err?.message || 'Failed to fetch CCU'); });
    };

    fetchCcu();
    timer.current = setInterval(fetchCcu, pollMs);
    return () => clearInterval(timer.current);
  }, [gameId, pollMs]);

  return { ccu, history, allTimeHigh, allTimeHighAt, error };
}
