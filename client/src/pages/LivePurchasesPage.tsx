import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Volume2, VolumeX, Package, User } from 'lucide-react';
import { formatCurrency, useCurrencyMode } from '../lib/currency';
import saleSoundUrl from '../assets/shopify-sales.mp3';

interface Props {
  selectedGameId: string | null;
}

interface RawPurchase {
  gameId: string;
  playerId: string;
  productId: string;
  productName: string;
  productType: string;
  priceRobux: number;
  timestamp: string;
}

interface LivePurchase extends RawPurchase {
  uid: string;
  displayName: string | null;
  avatarUrl: string | null;
  productIconUrl: string | null;
  resolvedProductName: string | null;
  isNew: boolean;
}

function playSaleSound(audio: HTMLAudioElement | null) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // Ignore autoplay or decode errors.
  }
}

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

let uidCounter = 0;

export default function LivePurchasesPage({ selectedGameId }: Props) {
  const { currencyMode } = useCurrencyMode();
  const [purchases, setPurchases] = useState<LivePurchase[]>([]);
  const [connected, setConnected] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(0);
  const saleAudioRef = useRef<HTMLAudioElement | null>(null);

  const playerCache = useRef<Map<string, { displayName: string | null; avatarUrl: string | null }>>(new Map());
  const productNameCache = useRef<Map<string, string | null>>(new Map());
  const productIconCache = useRef<Map<string, string | null>>(new Map());

  const pendingPlayers = useRef<Set<string>>(new Set());
  const pendingProducts = useRef<Set<string>>(new Set());
  const pendingIcons = useRef<Set<string>>(new Set());

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const audio = new Audio(saleSoundUrl);
    audio.preload = 'auto';
    audio.volume = 0.9;
    saleAudioRef.current = audio;
    return () => {
      if (saleAudioRef.current) {
        saleAudioRef.current.pause();
        saleAudioRef.current = null;
      }
    };
  }, []);

  const authHeaders = useCallback((): HeadersInit | undefined => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const resolvePlayersBatch = useCallback(async (playerIds: string[]) => {
    if (!selectedGameId || playerIds.length === 0) return;
    const uncached = playerIds.filter((id) => !playerCache.current.has(id) && !pendingPlayers.current.has(id));
    if (uncached.length === 0) return;
    for (const id of uncached) pendingPlayers.current.add(id);
    try {
      const res = await fetch(
        `/api/stats/${selectedGameId}/player-profiles?ids=${encodeURIComponent(uncached.join(','))}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed to resolve player profiles');
      const data = await res.json();
      const profiles = data?.profiles || {};
      for (const id of uncached) {
        const p = profiles[id];
        playerCache.current.set(id, {
          displayName: p?.displayName || p?.username || null,
          avatarUrl: p?.avatarUrl || null,
        });
      }
      setPurchases((prev) =>
        prev.map((purchase) => {
          const cached = playerCache.current.get(purchase.playerId);
          if (!cached) return purchase;
          return { ...purchase, displayName: cached.displayName, avatarUrl: cached.avatarUrl };
        })
      );
    } catch {
      for (const id of uncached) {
        playerCache.current.set(id, { displayName: null, avatarUrl: null });
      }
    } finally {
      for (const id of uncached) pendingPlayers.current.delete(id);
    }
  }, [selectedGameId, authHeaders]);

  const resolvePlayer = useCallback(async (playerId: string) => {
    await resolvePlayersBatch([playerId]);
  }, [resolvePlayersBatch]);

  const resolveProductName = useCallback(async (productId: string, productType: string) => {
    const key = `${productType}:${productId}`;
    if (productNameCache.current.has(key) || pendingProducts.current.has(key)) return;
    pendingProducts.current.add(key);
    try {
      const res = await fetch(`/api/proxy/product-name/${productId}?type=${productType}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to resolve product name');
      const data = await res.json();
      productNameCache.current.set(key, data.name || null);
      if (data.name) {
        setPurchases((prev) =>
          prev.map((p) =>
            p.productId === productId && p.productType === productType
              ? { ...p, resolvedProductName: data.name }
              : p
          )
        );
      }
    } catch {
      productNameCache.current.set(key, null);
    } finally {
      pendingProducts.current.delete(key);
    }
  }, [authHeaders]);

  const resolveProductIcon = useCallback(async (productId: string, productType: string) => {
    const key = `${productType}:${productId}`;
    if (productIconCache.current.has(key) || pendingIcons.current.has(key)) return;
    pendingIcons.current.add(key);
    try {
      const type = productType === 'gamepass' ? 'gamepass' : 'devproduct';
      const res = await fetch(`/api/proxy/product-icons?ids=${productId}&type=${type}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to resolve product icon');
      const data = await res.json();
      const iconUrl = data[productId] || null;
      productIconCache.current.set(key, iconUrl);
      setPurchases((prev) =>
        prev.map((p) =>
          p.productId === productId && p.productType === productType
            ? { ...p, productIconUrl: iconUrl }
            : p
        )
      );
    } catch {
      productIconCache.current.set(key, null);
    } finally {
      pendingIcons.current.delete(key);
    }
  }, [authHeaders]);

  const initialLoaded = useRef(false);
  useEffect(() => {
    if (!selectedGameId || initialLoaded.current) return;
    initialLoaded.current = true;

    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`/api/stats/${selectedGameId}/recent-purchases?limit=25`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const initial: LivePurchase[] = (data.purchases || []).map((raw: RawPurchase) => {
          const playerData = playerCache.current.get(raw.playerId);
          const nameKey = `${raw.productType}:${raw.productId}`;
          return {
            ...raw,
            uid: `init-${uidCounter++}`,
            displayName: playerData?.displayName || null,
            avatarUrl: playerData?.avatarUrl || null,
            productIconUrl: productIconCache.current.get(nameKey) ?? null,
            resolvedProductName: productNameCache.current.get(nameKey) ?? null,
            isNew: false,
          };
        });

        setPurchases(initial);

        const playerIds = new Set(initial.map((p) => p.playerId));
        const productKeys = new Set(initial.map((p) => `${p.productType}:${p.productId}`));
        resolvePlayersBatch(Array.from(playerIds));
        for (const key of productKeys) {
          const [type, id] = key.split(':');
          resolveProductName(id, type);
          resolveProductIcon(id, type);
        }
      } catch (e) {
        console.error('Failed to load recent purchases:', e);
      }
    })();
  }, [selectedGameId, resolvePlayersBatch, resolveProductName, resolveProductIcon]);

  useEffect(() => {
    initialLoaded.current = false;
    setPurchases([]);
    prevCountRef.current = 0;
  }, [selectedGameId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('WS connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'purchase') {
            const raw: RawPurchase = msg.data;

            const playerData = playerCache.current.get(raw.playerId);
            const nameKey = `${raw.productType}:${raw.productId}`;
            const iconKey = nameKey;
            const resolvedName = productNameCache.current.get(nameKey);
            const resolvedIcon = productIconCache.current.get(iconKey);

            const purchase: LivePurchase = {
              ...raw,
              uid: `${Date.now()}-${uidCounter++}`,
              displayName: playerData?.displayName || null,
              avatarUrl: playerData?.avatarUrl || null,
              productIconUrl: resolvedIcon ?? null,
              resolvedProductName: resolvedName ?? null,
              isNew: true,
            };

            setPurchases((prev) => [purchase, ...prev].slice(0, 200));

            if (!playerData) resolvePlayer(raw.playerId);
            if (resolvedName === undefined) resolveProductName(raw.productId, raw.productType);
            if (resolvedIcon === undefined) resolveProductIcon(raw.productId, raw.productType);
          }
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [resolvePlayer, resolveProductName, resolveProductIcon]);

  useEffect(() => {
    if (purchases.length === 0) return;
    const newest = purchases[0];
    if (!newest.isNew) return;
    const timer = setTimeout(() => {
      setPurchases((prev) =>
        prev.map((p) => (p.uid === newest.uid ? { ...p, isNew: false } : p))
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [purchases]);

  useEffect(() => {
    const filtered = purchases.filter((p) => !selectedGameId || p.gameId === selectedGameId);
    if (filtered.length > prevCountRef.current && soundOn) {
      playSaleSound(saleAudioRef.current);
    }
    prevCountRef.current = filtered.length;
  }, [purchases, selectedGameId, soundOn]);

  const filteredPurchases = selectedGameId
    ? purchases.filter((p) => p.gameId === selectedGameId)
    : purchases;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Purchases</h1>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[10px] font-semibold ${connected ? 'bg-status-success-bg text-status-success border border-status-success/20' : 'bg-status-danger-bg text-status-danger border border-status-danger/20'}`}>
              <Radio size={10} className={connected ? 'animate-pulse-soft' : ''} />
              {connected ? 'LIVE' : 'DISCONNECTED'}
            </div>
            <button
              onClick={() => setSoundOn((s) => !s)}
              className="w-8 h-8 rounded-btn flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-colors"
              title={soundOn ? 'Mute sound' : 'Unmute sound'}
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
        <p className="text-text-muted text-[13px] mt-1">Real-time purchase feed</p>
      </div>

      {/* Feed */}
      <div className="card overflow-hidden">
        <div className="relative z-10">
          <div className="hidden md:grid grid-cols-[48px_1fr_1fr_120px_100px] gap-4 px-6 md:px-7 py-3 border-b border-border">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider" />
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Player</span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Product</span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">Price</span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">When</span>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="px-6 sm:px-7 py-16 text-center">
              <Radio size={28} className="mx-auto text-text-muted mb-3 animate-pulse-soft" />
              <p className="text-text-secondary text-[13px] font-medium">Waiting for purchases...</p>
              <p className="text-text-muted text-[11px] mt-1">Purchases will appear here in real time</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredPurchases.map((p) => (
                <PurchaseRow key={p.uid} purchase={p} currencyMode={currencyMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PurchaseRow({ purchase: p, currencyMode }: { purchase: LivePurchase; currencyMode: 'robux' | 'usd' }) {
  return (
    <div
      className={`
        px-6 sm:px-7 py-3.5 transition-all duration-500 ease-out
        hover:bg-white/[0.02]
        ${p.isNew ? 'bg-accent/[0.04] animate-fade-in' : ''}
      `}
    >
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-[48px_1fr_1fr_120px_100px] gap-4 items-center">
        <div className="w-10 h-10 rounded-full bg-bg-elevated overflow-hidden border border-border shrink-0">
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={14} className="text-text-muted" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-white text-[13px] font-medium truncate">
            {p.displayName || p.playerId}
          </p>
          {p.displayName && (
            <p className="text-text-muted text-[10px] truncate">{p.playerId}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-btn bg-bg-elevated overflow-hidden border border-border">
            {p.productIconUrl ? (
              <img src={p.productIconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={12} className="text-text-muted" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-text-secondary text-[13px] font-medium truncate">
              {p.resolvedProductName || p.productName}
            </p>
            <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-pill ${p.productType === 'gamepass' ? 'bg-purple-500/10 text-purple-400' : 'bg-accent/10 text-accent-light'}`}>
              {p.productType === 'gamepass' ? 'Gamepass' : 'DevProduct'}
            </span>
          </div>
        </div>

        <p className="text-white text-[14px] font-semibold text-right tabular-nums">
          {formatCurrency(p.priceRobux, currencyMode)}
        </p>

        <p className="text-text-muted text-[11px] text-right">{timeAgo(p.timestamp)}</p>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-bg-elevated overflow-hidden border border-border shrink-0">
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={14} className="text-text-muted" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white text-[13px] font-medium truncate">
              {p.displayName || p.playerId}
            </p>
            <p className="text-white text-[13px] font-semibold whitespace-nowrap tabular-nums">
              {formatCurrency(p.priceRobux, currencyMode)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4 h-4 shrink-0 rounded-sm bg-bg-elevated overflow-hidden border border-border">
                {p.productIconUrl ? (
                  <img src={p.productIconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package size={8} className="text-text-muted m-auto" />
                )}
              </div>
              <p className="text-text-muted text-[11px] truncate">
                {p.resolvedProductName || p.productName}
              </p>
            </div>
            <p className="text-text-muted text-[10px] whitespace-nowrap">{timeAgo(p.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
