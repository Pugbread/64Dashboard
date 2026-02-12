import { useState, useEffect, useCallback } from 'react';
import { getProductBreakdown } from '../api/client';

export interface ProductEntry {
  productId: string;
  productName: string;
  productType: 'devproduct' | 'gamepass';
  revenue: number;
  sales: number;
  iconUrl: string | null;
  avgSessionMin: number | null;
  avgTotalPlaytimeMin: number | null;
  repeatSpenderRate: number | null;
}

export interface ProductBreakdownResponse {
  products: ProductEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  range: string;
  from: string;
  to: string;
}

export function useProductBreakdown(gameId: string | null, range: string, page: number = 1) {
  const [data, setData] = useState<ProductBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      const { data: resp } = await getProductBreakdown(gameId, range, page, 25);
      setData(resp);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [gameId, range, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading };
}
