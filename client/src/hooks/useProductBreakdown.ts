import { useState, useEffect, useCallback } from 'react';
import { getProductBreakdown } from '../api/client';

export interface ProductEntry {
  productId: string;
  productName: string;
  productType: 'devproduct' | 'gamepass';
  revenue: number;
  sales: number;
  iconUrl: string | null;
}

export interface ProductBreakdownResponse {
  products: ProductEntry[];
  range: string;
  from: string;
  to: string;
}

export function useProductBreakdown(gameId: string | null, range: string) {
  const [data, setData] = useState<ProductBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const { data: resp } = await getProductBreakdown(gameId, range);
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
