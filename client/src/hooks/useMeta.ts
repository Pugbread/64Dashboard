import { useState, useEffect } from 'react';
import { getStatsMeta } from '../api/client';

export interface MetaResponse {
  categories: string[];
  providers: Array<{ id: string; name: string; category: string; unit?: string; format?: string }>;
  ranges: string[];
  intervals: string[];
  intervalAvailability: Record<string, string[]>;
  defaultIntervals: Record<string, string>;
}

export function useMeta() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStatsMeta()
      .then(({ data }) => { setMeta(data); setError(null); })
      .catch((err) => { setError(err?.message || 'Failed to fetch metadata'); console.error(err); })
      .finally(() => setLoading(false));
  }, []);

  return { meta, loading, error };
}
