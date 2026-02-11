import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
      setUtcTime(getCurrentUTC());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center justify-end px-8 py-4 border-b border-border bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-5">
        {/* Current UTC time */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-[10px] font-medium uppercase tracking-wider">UTC</span>
          <span className="font-mono text-[13px] text-text-secondary font-semibold tracking-widest">{utcTime}</span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Countdown to new day */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] text-white font-bold tracking-[0.15em]">{countdown}</span>
            <span className="text-text-muted text-[9px] font-bold uppercase tracking-widest">UNTIL NEW DAY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
