import { useState, useEffect, useRef } from 'react';
import { getCCU } from '../api/client';

export function useCCU(gameId: string | null, pollMs = 10_000) {
  const [ccu, setCcu] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!gameId) { setCcu(0); return; }

    const fetch = () => {
      getCCU(gameId)
        .then(({ data }) => setCcu(data.ccu ?? 0))
        .catch(() => {});
    };

    fetch();
    timer.current = setInterval(fetch, pollMs);
    return () => clearInterval(timer.current);
  }, [gameId, pollMs]);

  return ccu;
}
