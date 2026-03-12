import { useState, useCallback } from 'react';
import type { Coin } from '../types/coin';

const KEY = 'ibispulse_watchlist';

function load(): Map<string, Coin> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Map();
    const entries: [string, Coin][] = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function save(map: Map<string, Coin>) {
  localStorage.setItem(KEY, JSON.stringify([...map.entries()]));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Map<string, Coin>>(load);

  const toggle = useCallback((coin: Coin) => {
    setWatchlist(prev => {
      const next = new Map(prev);
      if (next.has(coin.id)) next.delete(coin.id);
      else next.set(coin.id, coin);
      save(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((id: string) => watchlist.has(id), [watchlist]);

  // Watchlist'teki coinlerin fiyatlarını güncel tut
  const updatePrices = useCallback((coins: Coin[]) => {
    setWatchlist(prev => {
      let changed = false;
      const next = new Map(prev);
      coins.forEach(c => {
        if (next.has(c.id)) { next.set(c.id, c); changed = true; }
      });
      if (changed) save(next);
      return changed ? next : prev;
    });
  }, []);

  return { watchlist: [...watchlist.values()], isWatched, toggle, updatePrices };
}
