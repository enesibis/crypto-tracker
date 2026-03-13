import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Coin } from '../types/coin';
import { useWatchlist } from '../hooks/useWatchlist';

interface PagedResponse {
  content: Coin[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

type SortField = 'name' | 'priceUsd' | 'marketCapUsd' | 'volume24hUsd' | 'priceChange24h';
type SortDir = 'asc' | 'desc';

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(6);
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

const PAGE_SIZE = 20;

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  const active = sortBy === field;
  return (
    <span className="ml-1 text-xs" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', opacity: active ? 1 : 0.5 }}>
      {!active ? '↕' : sortDir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

export default function CoinTable() {
  const navigate = useNavigate();
  const [data, setData] = useState<PagedResponse | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('marketCapUsd');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [tableKey, setTableKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const prevPrices = useRef<Record<string, number>>({});
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const { watchlist, isWatched, toggle, updatePrices } = useWatchlist();

  function handleToggle(coin: Coin) {
    toggle(coin);
    setAnimatingId(coin.id);
    setTimeout(() => setAnimatingId(null), 400);
  }

  const fetchCoins = useCallback(async (p: number, q: string, field: SortField, dir: SortDir) => {
    try {
      const params = new URLSearchParams({ page: String(p), size: String(PAGE_SIZE), search: q, sortBy: field, sortDir: dir });
      const res = await fetch(`/api/coins?${params}`);
      const json: PagedResponse = await res.json();
      // Fiyat değişimlerini kaydet (flash için)
      const newPrices: Record<string, number> = {};
      json.content.forEach(c => { newPrices[c.id] = c.priceUsd; });
      prevPrices.current = newPrices;
      setData(json);
      setLastUpdate(new Date());
      updatePrices(json.content);
    } catch (err) {
      console.error('Coin verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setLoading(true); fetchCoins(page, search, sortBy, sortDir); }, [page, search, sortBy, sortDir, fetchCoins]);
  useEffect(() => { const i = setInterval(() => fetchCoins(page, search, sortBy, sortDir), 180000); return () => clearInterval(i); }, [page, search, sortBy, sortDir, fetchCoins]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); setSearch(searchInput); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleSort(field: SortField) {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
    setPage(0);
    setTableKey(k => k + 1);
  }

  function goToPage(p: number) {
    setPage(p);
    setTableKey(k => k + 1);
  }

  const displayCoins = showWatchlist ? watchlist : (data?.content ?? []);
  const coins = displayCoins;
  const totalPages = showWatchlist ? 1 : (data?.totalPages ?? 1);
  const totalElements = showWatchlist ? watchlist.length : (data?.totalElements ?? 0);
  const startRank = page * PAGE_SIZE + 1;

  const thStyle = (field: SortField): React.CSSProperties => ({
    color: sortBy === field ? 'var(--text-primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: sortBy === field ? 600 : 400,
  });

  const btnBase: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Sekmeler */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowWatchlist(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={!showWatchlist
              ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.4)' }
              : { color: 'var(--text-muted)' }}
            onMouseEnter={e => { if (showWatchlist) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (showWatchlist) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Tüm Coinler
          </button>
          <button
            onClick={() => setShowWatchlist(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={showWatchlist
              ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.4)' }
              : { color: 'var(--text-muted)' }}
            onMouseEnter={e => { if (!showWatchlist) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (!showWatchlist) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span style={{ fontSize: '12px' }}>★</span>
            Watchlist
            {watchlist.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: showWatchlist ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.15)', color: showWatchlist ? '#fff' : 'var(--accent)', fontSize: '10px' }}>
                {watchlist.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Coin ara..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <p className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
          {totalElements.toLocaleString()} coin{lastUpdate && ` · ${lastUpdate.toLocaleTimeString('tr-TR')}`}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="px-3 py-3.5 w-8" />
              <th className="px-4 py-3.5 text-left w-10 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>#</th>
              <th className="px-4 py-3.5 text-left text-xs uppercase tracking-wider" onClick={() => handleSort('name')} style={thStyle('name')}>
                Coin <SortIcon field="name" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider" onClick={() => handleSort('priceUsd')} style={thStyle('priceUsd')}>
                Fiyat <SortIcon field="priceUsd" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider" onClick={() => handleSort('priceChange24h')} style={thStyle('priceChange24h')}>
                24s % <SortIcon field="priceChange24h" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider hidden md:table-cell" onClick={() => handleSort('marketCapUsd')} style={thStyle('marketCapUsd')}>
                Piyasa Değeri <SortIcon field="marketCapUsd" sortBy={sortBy} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider hidden lg:table-cell" onClick={() => handleSort('volume24hUsd')} style={thStyle('volume24hUsd')}>
                Hacim (24s) <SortIcon field="volume24hUsd" sortBy={sortBy} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-20">
                  <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </td>
              </tr>
            ) : coins.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {showWatchlist ? '★ Henüz watchlist\'e coin eklemediniz' : `"${search}" için sonuç bulunamadı`}
                </td>
              </tr>
            ) : (
              coins.map((coin, index) => {
                const isPos = coin.priceChange24h >= 0;
                const prev = prevPrices.current[coin.id];
                const flashClass = prev == null ? '' : coin.priceUsd > prev ? 'flash-up' : coin.priceUsd < prev ? 'flash-down' : '';
                return (
                  <tr key={`${tableKey}-${coin.id}`}
                    className={`row-enter ${flashClass}`}
                    style={{ borderBottom: '1px solid var(--border)', animationDelay: `${index * 30}ms`, cursor: 'pointer' }}
                    onClick={() => navigate(`/coin/${coin.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggle(coin)}
                        title={isWatched(coin.id) ? 'Watchlist\'ten çıkar' : 'Watchlist\'e ekle'}
                        className={`star-btn ${animatingId === coin.id ? (isWatched(coin.id) ? 'watched' : 'unwatched-anim') : ''}`}
                        style={{ color: isWatched(coin.id) ? '#f59e0b' : 'var(--text-muted)', fontSize: '17px' }}
                      >
                        {isWatched(coin.id) ? '★' : '☆'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-muted)' }}>{showWatchlist ? (watchlist.findIndex(w => w.id === coin.id) + 1) : startRank + index}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={coin.imageUrl} alt={coin.name} className="w-8 h-8 rounded-full" />
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{coin.name}</span>
                          <span className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>{coin.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${formatPrice(coin.priceUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: isPos ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                          color: isPos ? 'var(--positive)' : 'var(--negative)',
                        }}>
                        {isPos ? '▲' : '▼'} {Math.abs(coin.priceChange24h ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatLargeNumber(coin.marketCapUsd)}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatLargeNumber(coin.volume24hUsd)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 mt-6">
          {/* Sayfa bilgisi */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{page + 1}</span>
            {' '}/ {totalPages} sayfa
            &nbsp;·&nbsp;
            {totalElements.toLocaleString()} coin
          </p>

          {/* Butonlar */}
          <div className="flex items-center gap-1.5">
            {/* İlk sayfa */}
            <button
              onClick={() => goToPage(0)} disabled={page === 0}
              className="page-btn px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-25 disabled:cursor-not-allowed"
              style={btnBase} title="İlk sayfa"
            >«</button>

            {/* Önceki */}
            <button
              onClick={() => goToPage(page - 1)} disabled={page === 0}
              className="page-btn px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-25 disabled:cursor-not-allowed"
              style={btnBase} title="Önceki"
            >‹</button>

            {/* Sayfa numaraları */}
            <div className="flex items-center gap-1">
              {page > 2 && (
                <>
                  <button onClick={() => goToPage(0)} className="page-btn px-3 py-2 rounded-xl text-xs font-semibold" style={btnBase}>1</button>
                  {page > 3 && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
                </>
              )}
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => Math.abs(i - page) <= 2)
                .map(i => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`page-btn px-3 py-2 rounded-xl text-xs font-semibold${i === page ? ' active' : ''}`}
                    style={i === page
                      ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : btnBase}
                  >
                    {i + 1}
                  </button>
                ))}
              {page < totalPages - 3 && (
                <>
                  {page < totalPages - 4 && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
                  <button onClick={() => goToPage(totalPages - 1)} className="page-btn px-3 py-2 rounded-xl text-xs font-semibold" style={btnBase}>{totalPages}</button>
                </>
              )}
            </div>

            {/* Sonraki */}
            <button
              onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1}
              className="page-btn px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-25 disabled:cursor-not-allowed"
              style={btnBase} title="Sonraki"
            >›</button>

            {/* Son sayfa */}
            <button
              onClick={() => goToPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="page-btn px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-25 disabled:cursor-not-allowed"
              style={btnBase} title="Son sayfa"
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
