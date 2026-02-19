import { useState, useEffect } from 'react';
import { useCurrencyMode } from '../lib/currency';
import { Clock } from 'lucide-react';

function getTimeUntilMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCurrentUTC(): string {
  const now = new Date();
  return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
}

export default function TopBar() {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [utcTime, setUtcTime] = useState(getCurrentUTC());
  const { currencyMode, setCurrencyMode } = useCurrencyMode();

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
      setUtcTime(getCurrentUTC());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center justify-end px-8 py-3 border-b border-border bg-bg-primary/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {/* Currency toggle */}
        <div className="flex items-center gap-0.5 rounded-btn bg-bg-elevated border border-border p-0.5">
          <button
            onClick={() => setCurrencyMode('robux')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-[6px] transition-all duration-200 ${
              currencyMode === 'robux' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            R$
          </button>
          <button
            onClick={() => setCurrencyMode('usd')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-[6px] transition-all duration-200 ${
              currencyMode === 'usd' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            USD
          </button>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* UTC time */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-btn bg-bg-elevated/60 border border-border">
          <Clock size={11} className="text-text-muted" />
          <span className="text-text-muted text-[10px] font-medium">UTC</span>
          <span className="font-mono text-[12px] text-text-secondary font-semibold tracking-wider">{utcTime}</span>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Countdown */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-btn bg-bg-elevated/60 border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" />
          <span className="font-mono text-[13px] text-white font-bold tracking-[0.12em]">{countdown}</span>
          <span className="text-text-muted text-[9px] font-semibold uppercase tracking-widest">reset</span>
        </div>
      </div>
    </div>
  );
}
