import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  priceUsd: number;
  priceChange24h: number;
}

interface TrendingData {
  gainers: Coin[];
  losers: Coin[];
}

function formatPrice(p: number) {
  if (p >= 1) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return p.toFixed(4);
}

export default function TrendingSection() {
  const [data, setData] = useState<TrendingData | null>(null);
  const navigate = useNavigate();
  const { symbol, convert } = useCurrency();

  useEffect(() => {
    fetch('/api/coins/trending?limit=8')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <TrendCard title="En Çok Kazanan" coins={data.gainers} positive navigate={navigate} symbol={symbol} convert={convert} />
      <TrendCard title="En Çok Kaybeden" coins={data.losers} positive={false} navigate={navigate} symbol={symbol} convert={convert} />
    </div>
  );
}

function TrendCard({ title, coins, positive, navigate, symbol, convert }: {
  title: string;
  coins: Coin[];
  positive: boolean;
  navigate: (p: string) => void;
  symbol: string;
  convert: (v: number) => number;
}) {
  const accent = positive ? '#22c55e' : '#ef4444';
  const bg = positive ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)';
  const border = positive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col" style={{ background: 'var(--bg-card)', border: `1px solid ${border}` }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <span style={{ color: accent, fontSize: 15 }}>{positive ? '▲' : '▼'}</span>
        <span className="text-sm font-bold" style={{ color: accent }}>{title}</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>24s</span>
      </div>
      <div>
        {coins.map((coin, i) => (
          <button
            key={coin.id}
            onClick={() => navigate(`/coin/${coin.id}`)}
            className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer text-left"
            style={{
              background: 'transparent',
              border: 'none',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              color: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <img src={coin.imageUrl} alt={coin.name} className="w-7 h-7 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{coin.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{coin.symbol?.toUpperCase()}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {symbol}{formatPrice(convert(coin.priceUsd))}
              </div>
              <div className="text-xs font-bold" style={{ color: accent }}>
                {positive ? '+' : ''}{coin.priceChange24h?.toFixed(2)}%
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
