import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCountUp } from '../hooks/useCountUp';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { Coin } from '../types/coin';

interface HistoryPoint {
  recordedAt: string;
  priceUsd: number;
}

interface NewsArticle {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
  thumbnail: string;
  enclosure: { link: string; type: string };
}

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

const DAYS_OPTIONS = [
  { label: '1G', value: 1 },
  { label: '7G', value: 7 },
  { label: '30G', value: 30 },
  { label: '90G', value: 90 },
];

export default function CoinDetailPage() {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, authFetch } = useAuth();
  const [portfolioModal, setPortfolioModal] = useState(false);
  const [qty, setQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [coin, setCoin] = useState<Coin | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    if (!coinId) return;
    fetch(`/api/coins/${coinId}`)
      .then(r => r.json())
      .then(setCoin)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [coinId]);

  useEffect(() => {
    if (!coinId) return;
    setHistoryLoading(true);
    fetch(`/api/coins/${coinId}/history?days=${days}`)
      .then(r => r.json())
      .then((data: HistoryPoint[]) => setHistory(data))
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [coinId, days]);

  useEffect(() => {
    if (!coin) return;
    setNewsLoading(true);
    fetch(`/api/news/${coin.symbol.toUpperCase()}?name=${encodeURIComponent(coin.name)}`)
      .then(r => r.json())
      .then(data => setNews((data.items || []).slice(0, 8)))
      .catch(console.error)
      .finally(() => setNewsLoading(false));
  }, [coin]);

  // Hook'lar her zaman çağrılmalı (Rules of Hooks)
  const animatedPrice = useCountUp(coin?.priceUsd ?? 0, 900);
  const animatedMarketCap = useCountUp(coin?.marketCapUsd ?? 0, 1100);
  const animatedVolume = useCountUp(coin?.volume24hUsd ?? 0, 1000);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="text-center py-32" style={{ color: 'var(--text-muted)' }}>
        Coin bulunamadı.
      </div>
    );
  }

  const isPos = coin.priceChange24h >= 0;
  const chartColor = isPos ? '#34d399' : '#f87171';
  const minPrice = Math.min(...history.map(h => h.priceUsd));
  const maxPrice = Math.max(...history.map(h => h.priceUsd));
  const priceDiff = history.length >= 2
    ? history[history.length - 1].priceUsd - history[0].priceUsd
    : 0;
  const priceDiffPct = history.length >= 2 && history[0].priceUsd !== 0
    ? (priceDiff / history[0].priceUsd) * 100
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Geri butonu */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 mb-6 text-sm px-4 py-2 rounded-xl transition-all cursor-pointer"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
        </svg>
        Geri
      </button>

      {/* Portfolio modal */}
      {portfolioModal && coin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPortfolioModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'modalPop 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <img src={coin.imageUrl} alt={coin.name} className="w-9 h-9 rounded-full" />
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{coin.name} — Portfolio</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Miktar</label>
                <input type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)}
                  placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Alış Fiyatı (USD)
                  <button className="ml-2 text-xs cursor-pointer" style={{ color: 'var(--accent)' }}
                    onClick={() => setBuyPrice(String(coin.priceUsd))}>
                    Güncel fiyatı kullan
                  </button>
                </label>
                <input type="number" min="0" step="any" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                  placeholder={`$${coin.priceUsd}`} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setPortfolioModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  İptal
                </button>
                <button disabled={portfolioSaving} onClick={async () => {
                  setPortfolioSaving(true);
                  await authFetch('/api/portfolio', { method: 'POST', body: JSON.stringify({ coinId: coin.id, quantity: parseFloat(qty), buyPrice: parseFloat(buyPrice) }) });
                  setPortfolioSaving(false);
                  setPortfolioModal(false);
                  navigate('/portfolio');
                }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  {portfolioSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coin başlık */}
      <div className="flex items-center gap-4 mb-8">
        <img src={coin.imageUrl} alt={coin.name} className="w-14 h-14 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{coin.name}</h1>
            <span className="text-sm uppercase font-medium" style={{ color: 'var(--text-muted)' }}>{coin.symbol}</span>
            {isLoggedIn && (
              <button onClick={() => { setBuyPrice(''); setQty(''); setPortfolioModal(true); }}
                className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent)' }}>
                + Portfolio'ya Ekle
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
              ${formatPrice(animatedPrice)}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold"
              style={{
                background: isPos ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                color: isPos ? 'var(--positive)' : 'var(--negative)',
              }}>
              {isPos ? '▲' : '▼'} {Math.abs(coin.priceChange24h ?? 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Piyasa Değeri', value: formatLargeNumber(animatedMarketCap) },
          { label: '24s Hacim', value: formatLargeNumber(animatedVolume) },
          { label: 'Son Güncelleme', value: new Date(coin.lastUpdated).toLocaleTimeString('tr-TR') },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Grafik kartı */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Grafik başlık + period seçici */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              {days}g değişim
            </p>
            {history.length >= 2 && (
              <p className="text-sm font-semibold" style={{ color: priceDiff >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {priceDiff >= 0 ? '+' : ''}{priceDiffPct.toFixed(2)}%
                <span className="font-normal text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  ({priceDiff >= 0 ? '+' : ''}${formatPrice(Math.abs(priceDiff))})
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {DAYS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={days === opt.value
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-muted)', background: 'transparent' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grafik */}
        {historyLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-muted)' }}>
            Bu periyot için veri bulunamadı.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="recordedAt"
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return days <= 1
                    ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
                }}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice * 0.995, maxPrice * 1.005]}
                tickFormatter={(v: number) => `$${formatPrice(v)}`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
                labelFormatter={(v: string) => new Date(v).toLocaleString('tr-TR')}
                formatter={(v: number) => [`$${formatPrice(v)}`, 'Fiyat']}
              />
              <Area
                type="monotone"
                dataKey="priceUsd"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 4, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Haberler */}
      <div className="mt-8">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {coin.symbol.toUpperCase()} Haberleri
        </h2>
        {newsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            Haber bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map(article => {
              const timeAgo = (() => {
                const diff = Math.floor((Date.now() - new Date(article.pubDate).getTime()) / 1000);
                if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}s önce`;
                return `${Math.floor(diff / 86400)}g önce`;
              })();
              const image = article.enclosure?.link || article.thumbnail || '';
              return (
                <a
                  key={article.guid}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-2xl p-4 transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {image && (
                    <img
                      src={image}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex flex-col justify-between min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-3"
                      style={{ color: 'var(--text-primary)' }}>
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Google News</span>
                      {article.author && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {article.author}</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {timeAgo}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
