import { useEffect, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  priceUsd: number;
  priceChange24h: number;
  marketCapUsd: number;
  volume24hUsd: number;
}

interface HistoryPoint {
  recordedAt: string;
  priceUsd: number;
}

const DAYS_OPTIONS = [
  { label: '1G', value: 1 },
  { label: '7G', value: 7 },
  { label: '30G', value: 30 },
  { label: '90G', value: 90 },
];

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(6);
}

function formatLarge(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

export default function ComparePage() {
  const { symbol, convert } = useCurrency();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [coinA, setCoinA] = useState<Coin | null>(null);
  const [coinB, setCoinB] = useState<Coin | null>(null);
  const [historyA, setHistoryA] = useState<HistoryPoint[]>([]);
  const [historyB, setHistoryB] = useState<HistoryPoint[]>([]);
  const [days, setDays] = useState(7);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [pickingA, setPickingA] = useState(false);
  const [pickingB, setPickingB] = useState(false);

  useEffect(() => {
    fetch('/api/coins?page=0&size=200')
      .then(r => r.json())
      .then(data => setCoins(data.content || []));
  }, []);

  useEffect(() => {
    if (coinA) {
      fetch(`/api/coins/${coinA.id}/history?days=${days}`)
        .then(r => r.json())
        .then(setHistoryA);
    }
  }, [coinA, days]);

  useEffect(() => {
    if (coinB) {
      fetch(`/api/coins/${coinB.id}/history?days=${days}`)
        .then(r => r.json())
        .then(setHistoryB);
    }
  }, [coinB, days]);

  // Merge histories by index (normalize to % change from first point)
  const chartData = (() => {
    if (!historyA.length && !historyB.length) return [];
    const len = Math.max(historyA.length, historyB.length);
    const baseA = historyA[0]?.priceUsd;
    const baseB = historyB[0]?.priceUsd;
    return Array.from({ length: len }, (_, i) => {
      const pA = historyA[i]?.priceUsd;
      const pB = historyB[i]?.priceUsd;
      const label = (historyA[i] || historyB[i])?.recordedAt;
      const date = label ? new Date(label) : null;
      const dateStr = date ? (days <= 1 ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' })) : '';
      return {
        date: dateStr,
        [coinA?.symbol || 'A']: baseA && pA ? +((pA / baseA - 1) * 100).toFixed(2) : undefined,
        [coinB?.symbol || 'B']: baseB && pB ? +((pB / baseB - 1) * 100).toFixed(2) : undefined,
        rawA: pA,
        rawB: pB,
      };
    });
  })();

  const filteredA = coins.filter(c => c.name.toLowerCase().includes(searchA.toLowerCase()) || c.symbol.toLowerCase().includes(searchA.toLowerCase()));
  const filteredB = coins.filter(c => c.name.toLowerCase().includes(searchB.toLowerCase()) || c.symbol.toLowerCase().includes(searchB.toLowerCase()));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Coin Karşılaştırma</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>İki coini yan yana karşılaştır</p>
      </div>

      {/* Coin Seçiciler */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <CoinPicker label="1. Coin" coin={coinA} picking={pickingA} search={searchA}
          coins={filteredA} color="#3b82f6"
          onSearchChange={setSearchA} onToggle={() => { setPickingA(p => !p); setPickingB(false); }}
          onSelect={c => { setCoinA(c); setPickingA(false); setSearchA(''); }} />
        <CoinPicker label="2. Coin" coin={coinB} picking={pickingB} search={searchB}
          coins={filteredB} color="#a855f7"
          onSearchChange={setSearchB} onToggle={() => { setPickingB(p => !p); setPickingA(false); }}
          onSelect={c => { setCoinB(c); setPickingB(false); setSearchB(''); }} />
      </div>

      {/* Grafik */}
      {(coinA || coinB) && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              % değişim (başlangıç noktasına göre normalize)
            </p>
            <div className="flex gap-1">
              {DAYS_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setDays(d.value)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{
                    background: days === d.value ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: days === d.value ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  formatter={(value: number, name: string) => [`${value > 0 ? '+' : ''}${value}%`, name.toUpperCase()]}
                />
                <Legend formatter={v => v.toUpperCase()} />
                {coinA && <Line type="monotone" dataKey={coinA.symbol} stroke="#3b82f6" dot={false} strokeWidth={2} connectNulls />}
                {coinB && <Line type="monotone" dataKey={coinB.symbol} stroke="#a855f7" dot={false} strokeWidth={2} connectNulls />}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Grafik verisi yükleniyor...
            </div>
          )}
        </div>
      )}

      {/* İstatistik Karşılaştırma */}
      {coinA && coinB && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="px-5 py-3 text-left" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Metrik</th>
                <th className="px-5 py-3 text-right" style={{ color: '#3b82f6' }}>{coinA.name}</th>
                <th className="px-5 py-3 text-right" style={{ color: '#a855f7' }}>{coinB.name}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Güncel Fiyat', a: `${symbol}${formatPrice(convert(coinA.priceUsd))}`, b: `${symbol}${formatPrice(convert(coinB.priceUsd))}` },
                {
                  label: '24s Değişim',
                  a: <span style={{ color: coinA.priceChange24h >= 0 ? '#22c55e' : '#ef4444' }}>{coinA.priceChange24h?.toFixed(2)}%</span>,
                  b: <span style={{ color: coinB.priceChange24h >= 0 ? '#22c55e' : '#ef4444' }}>{coinB.priceChange24h?.toFixed(2)}%</span>,
                },
                { label: 'Piyasa Değeri', a: `${symbol}${formatLarge(convert(coinA.marketCapUsd))}`, b: `${symbol}${formatLarge(convert(coinB.marketCapUsd))}` },
                { label: '24s Hacim', a: `${symbol}${formatLarge(convert(coinA.volume24hUsd))}`, b: `${symbol}${formatLarge(convert(coinB.volume24hUsd))}` },
              ].map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
                  <td className="px-5 py-3.5 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{row.a}</td>
                  <td className="px-5 py-3.5 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CoinPicker({ label, coin, picking, search, coins, color, onSearchChange, onToggle, onSelect }: {
  label: string;
  coin: Coin | null;
  picking: boolean;
  search: string;
  coins: Coin[];
  color: string;
  onSearchChange: (v: string) => void;
  onToggle: () => void;
  onSelect: (c: Coin) => void;
}) {
  return (
    <div className="relative">
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer text-left"
        style={{ background: 'var(--bg-card)', border: `1px solid ${coin ? color + '50' : 'var(--border)'}` }}>
        {coin ? (
          <>
            <img src={coin.imageUrl} alt={coin.name} className="w-8 h-8 rounded-full flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{coin.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{coin.symbol?.toUpperCase()}</div>
            </div>
          </>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label} seç...</span>
        )}
        <svg className="ml-auto w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)', transform: picking ? 'rotate(180deg)' : '' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {picking && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl p-2 z-20 shadow-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <input type="text" placeholder="Ara..." value={search} onChange={e => onSearchChange(e.target.value)} autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm mb-2"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
          <div className="overflow-y-auto max-h-52">
            {coins.slice(0, 20).map(c => (
              <button key={c.id} onClick={() => onSelect(c)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-left"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <img src={c.imageUrl} alt={c.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>{c.symbol?.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
