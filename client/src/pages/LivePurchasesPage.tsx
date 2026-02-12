import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, Volume2, VolumeX, Package, User } from 'lucide-react';

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

/* ── Cha-ching sound via Web Audio API ── */
let audioCtx: AudioContext | null = null;

function playChaChing() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const ctx = audioCtx;

    // "Cha" — quick metallic hit
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1500, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);

    // "Ching" — higher, longer ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2400, ctx.currentTime + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.5);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.6);

    // Harmonics for sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(3600, ctx.currentTime + 0.1);
    osc3.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.3);
    gain3.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.1);
    osc3.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

/* ── Formatting ── */
function formatRobux(value: number): string {
  return `R$ ${value.toLocaleString()}`;
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
  const [purchases, setPurchases] = useState<LivePurchase[]>([]);
  const [connected, setConnected] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(0);

  // Caches for resolved data (persist across renders)
  const playerCache = useRef<Map<string, { displayName: string | null; avatarUrl: string | null }>>(new Map());
  const productNameCache = useRef<Map<string, string | null>>(new Map());
  const productIconCache = useRef<Map<string, string | null>>(new Map());

  // Pending resolution promises to avoid duplicate fetches
  const pendingPlayers = useRef<Set<string>>(new Set());
  const pendingProducts = useRef<Set<string>>(new Set());
  const pendingIcons = useRef<Set<string>>(new Set());

  // Interval for refreshing "time ago"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const resolvePlayer = useCallback(async (playerId: string) => {
    if (playerCache.current.has(playerId) || pendingPlayers.current.has(playerId)) return;
    pendingPlayers.current.add(playerId);
    try {
      const [infoRes, avatarRes] = await Promise.all([
        fetch(`/api/proxy/user-info/${playerId}`),
        fetch(`/api/proxy/user-avatar/${playerId}`),
      ]);
      const info = await infoRes.json();
      const avatar = await avatarRes.json();
      const data = { displayName: info.displayName || null, avatarUrl: avatar.imageUrl || null };
      playerCache.current.set(playerId, data);
      // Update existing purchases with this player
      setPurchases((prev) =>
        prev.map((p) =>
          p.playerId === playerId ? { ...p, displayName: data.displayName, avatarUrl: data.avatarUrl } : p
        )
      );
    } catch {
      playerCache.current.set(playerId, { displayName: null, avatarUrl: null });
    } finally {
      pendingPlayers.current.delete(playerId);
    }
  }, []);

  const resolveProductName = useCallback(async (productId: string, productType: string) => {
    const key = `${productType}:${productId}`;
    if (productNameCache.current.has(key) || pendingProducts.current.has(key)) return;
    pendingProducts.current.add(key);
    try {
      const res = await fetch(`/api/proxy/product-name/${productId}?type=${productType}`);
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
  }, []);

  const resolveProductIcon = useCallback(async (productId: string, productType: string) => {
    const key = `${productType}:${productId}`;
    if (productIconCache.current.has(key) || pendingIcons.current.has(key)) return;
    pendingIcons.current.add(key);
    try {
      const type = productType === 'gamepass' ? 'gamepass' : 'devproduct';
      const res = await fetch(`/api/proxy/product-icons?ids=${productId}&type=${type}`);
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
  }, []);

  // Load initial recent purchases
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

        // Resolve all players and products
        const playerIds = new Set(initial.map((p) => p.playerId));
        const productKeys = new Set(initial.map((p) => `${p.productType}:${p.productId}`));

        for (const pid of playerIds) resolvePlayer(pid);
        for (const key of productKeys) {
          const [type, id] = key.split(':');
          resolveProductName(id, type);
          resolveProductIcon(id, type);
        }
      } catch (e) {
        console.error('Failed to load recent purchases:', e);
      }
    })();
  }, [selectedGameId, resolvePlayer, resolveProductName, resolveProductIcon]);

  // Reset when game changes
  useEffect(() => {
    initialLoaded.current = false;
    setPurchases([]);
    prevCountRef.current = 0;
  }, [selectedGameId]);

  // WebSocket connection
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

            // Check caches
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

            // Trigger async resolution
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
        // Auto-reconnect after 3s
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
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [resolvePlayer, resolveProductName, resolveProductIcon]);

  // Remove the "new" animation flag after a short delay
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

  // Play sound when a new purchase for the current game arrives
  useEffect(() => {
    const filtered = purchases.filter((p) => !selectedGameId || p.gameId === selectedGameId);
    if (filtered.length > prevCountRef.current && soundOn) {
      playChaChing();
    }
    prevCountRef.current = filtered.length;
  }, [purchases, selectedGameId, soundOn]);

  const filteredPurchases = selectedGameId
    ? purchases.filter((p) => p.gameId === selectedGameId)
    : purchases;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight">Live Purchases</h2>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[10px] font-semibold ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              <Radio size={10} className={connected ? 'animate-pulse' : ''} />
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
        <p className="text-text-secondary text-[13px] mt-1">Real-time purchase feed</p>
      </div>

      {/* Feed */}
      <div className="card overflow-hidden">
        <div className="relative z-10">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[48px_1fr_1fr_120px_100px] gap-4 px-6 sm:px-7 py-3 border-b border-border">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider" />
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Player</span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Product</span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">Price</span>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">When</span>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="px-6 sm:px-7 py-16 text-center">
              <Radio size={32} className="mx-auto text-text-muted mb-3 animate-pulse" />
              <p className="text-text-secondary text-[13px] font-medium">Waiting for purchases...</p>
              <p className="text-text-muted text-[11px] mt-1">Purchases will appear here in real time</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredPurchases.map((p) => (
                <PurchaseRow key={p.uid} purchase={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Purchase Row ── */
function PurchaseRow({ purchase: p }: { purchase: LivePurchase }) {
  return (
    <div
      className={`
        px-6 sm:px-7 py-3.5 transition-all duration-500 ease-out
        hover:bg-white/[0.02]
        ${p.isNew ? 'bg-accent/[0.06] animate-fade-in' : ''}
      `}
    >
      {/* Desktop layout */}
      <div className="hidden sm:grid grid-cols-[48px_1fr_1fr_120px_100px] gap-4 items-center">
        {/* Player avatar */}
        <div className="w-10 h-10 rounded-full bg-bg-elevated overflow-hidden border border-border shrink-0">
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={14} className="text-text-muted" />
            </div>
          )}
        </div>

        {/* Player name */}
        <div className="min-w-0">
          <p className="text-white text-[13px] font-medium truncate">
            {p.displayName || p.playerId}
          </p>
          {p.displayName && (
            <p className="text-text-muted text-[10px] truncate">{p.playerId}</p>
          )}
        </div>

        {/* Product */}
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

        {/* Price */}
        <p className="text-white text-[14px] font-semibold text-right tabular-nums">
          {formatRobux(p.priceRobux)}
        </p>

        {/* Time */}
        <p className="text-text-muted text-[11px] text-right">{timeAgo(p.timestamp)}</p>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden flex items-center gap-3">
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
              {formatRobux(p.priceRobux)}
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
