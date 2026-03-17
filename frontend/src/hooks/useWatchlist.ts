import { useState, useCallback, useEffect } from 'react';
import type { Coin } from '../types/coin';
import { useAuth } from '../context/AuthContext';

const LOCAL_KEY = 'ibispulse_watchlist';

function loadLocal(): Map<string, Coin> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return new Map();
    return new Map(JSON.parse(raw) as [string, Coin][]);
  } catch {
    return new Map();
  }
}

function saveLocal(map: Map<string, Coin>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...map.entries()]));
}

export function useWatchlist() {
  const { token, authFetch } = useAuth();
  const [watchlist, setWatchlist] = useState<Map<string, Coin>>(new Map());
  const [synced, setSynced] = useState(false);

  // Token değişince (login / logout / hesap geçişi) listeyi yenile
  useEffect(() => {
    setSynced(false);

    if (!token) {
      // Giriş yok → localStorage'dan yükle
      setWatchlist(loadLocal());
      setSynced(true);
      return;
    }

    // Giriş var → sunucudan çek
    authFetch('/api/watchlist')
      .then(r => r.ok ? r.json() : [])
      .then((coins: Coin[]) => {
        setWatchlist(new Map(coins.map(c => [c.id, c])));
        setSynced(true);
      })
      .catch(() => setSynced(true));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((coin: Coin) => {
    if (token) {
      // Sunucu güncelle
      setWatchlist(prev => {
        const next = new Map(prev);
        const removing = next.has(coin.id);
        if (removing) next.delete(coin.id);
        else next.set(coin.id, coin);
        authFetch(`/api/watchlist/${coin.id}`, { method: removing ? 'DELETE' : 'POST' })
          .catch(console.error);
        return next;
      });
    } else {
      // localStorage güncelle
      setWatchlist(prev => {
        const next = new Map(prev);
        if (next.has(coin.id)) next.delete(coin.id);
        else next.set(coin.id, coin);
        saveLocal(next);
        return next;
      });
    }
  }, [token, authFetch]);

  const isWatched = useCallback((id: string) => watchlist.has(id), [watchlist]);

  const updatePrices = useCallback((coins: Coin[]) => {
    setWatchlist(prev => {
      let changed = false;
      const next = new Map(prev);
      coins.forEach(c => {
        if (next.has(c.id)) { next.set(c.id, c); changed = true; }
      });
      return changed ? next : prev;
    });
  }, []);

  return { watchlist: [...watchlist.values()], isWatched, toggle, updatePrices, synced };
}
