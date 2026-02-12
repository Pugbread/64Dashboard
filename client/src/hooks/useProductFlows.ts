import { useState, useEffect, useCallback } from 'react';
import { getProductFlows } from '../api/client';

export interface FlowProduct {
  productId: string;
  productName: string;
  productType: 'devproduct' | 'gamepass';
}

export interface ProductFlow {
  chain: string[];
  count: number;
  products: FlowProduct[];
}

export interface ProductFlowsResponse {
  flows: ProductFlow[];
  totalNewBuyers: number;
  range: string;
  from: string;
  to: string;
}

export function useProductFlows(gameId: string | null, range: string) {
  const [data, setData] = useState<ProductFlowsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!gameId) return;
    try {
      setLoading(true);
      setError(null);
      const { data: resp } = await getProductFlows(gameId, range);
      setData(resp);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Failed to fetch product flows');
    } finally {
      setLoading(false);
    }
  }, [gameId, range]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error };
}
