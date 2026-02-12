import { useEffect, useState } from 'react';

export type CurrencyMode = 'robux' | 'usd';

export const CURRENCY_STORAGE_KEY = 'currencyMode';
export const ROBUX_TO_USD = 0.7 * 0.0038;
const CURRENCY_EVENT = 'currency-mode-change';

export function getCurrencyMode(): CurrencyMode {
  if (typeof window === 'undefined') return 'robux';
  const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  return stored === 'usd' ? 'usd' : 'robux';
}

export function setCurrencyMode(mode: CurrencyMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CURRENCY_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: mode }));
}

export function useCurrencyMode() {
  const [currencyMode, setMode] = useState<CurrencyMode>(getCurrencyMode());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CURRENCY_STORAGE_KEY) setMode(getCurrencyMode());
    };
    const onCustom = () => setMode(getCurrencyMode());
    window.addEventListener('storage', onStorage);
    window.addEventListener(CURRENCY_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CURRENCY_EVENT, onCustom);
    };
  }, []);

  const updateMode = (mode: CurrencyMode) => setCurrencyMode(mode);

  return { currencyMode, setCurrencyMode: updateMode };
}

export function convertRobux(value: number, mode: CurrencyMode): number {
  return mode === 'usd' ? value * ROBUX_TO_USD : value;
}

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatCurrency(valueRobux: number, mode: CurrencyMode, full = false): string {
  const value = convertRobux(valueRobux, mode);
  if (mode === 'usd') {
    if (full) return `$ ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (Math.abs(value) >= 1000) return `$ ${compact(value)}`;
    return `$ ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  if (full) return `R$ ${value.toLocaleString()}`;
  return `R$ ${compact(value)}`;
}
