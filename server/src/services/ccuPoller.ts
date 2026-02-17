import { Pool } from 'pg';
import { pollAllGamesCcu } from './ccuService';

const POLL_MS = 10_000;
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

export function startCcuPoller(pool: Pool): void {
  if (started) return;
  started = true;

  const run = async () => {
    try {
      await pollAllGamesCcu(pool);
    } catch (error) {
      console.error('CCU poller tick failed:', error);
    }
  };

  // Warm quickly after boot, then continue every minute.
  void run();
  timer = setInterval(run, POLL_MS);
  console.log(`CCU poller started (${Math.floor(POLL_MS / 1000)}s interval)`);
}

export function stopCcuPoller(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
