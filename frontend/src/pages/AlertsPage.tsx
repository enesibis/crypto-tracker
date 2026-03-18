import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

interface Alert {
  id: number;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: string;
}

interface Coin {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  priceUsd: number;
}

export default function AlertsPage() {
  const { authFetch, isLoggedIn } = useAuth();
  const { symbol, convert } = useCurrency();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAlerts();
  }, [isLoggedIn]);

  const fetchAlerts = () => {
    authFetch('/api/alerts')
      .then(r => r.json())
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!showModal) return;
    fetch('/api/coins?page=0&size=100')
      .then(r => r.json())
      .then(data => setCoins(data.content || []))
      .catch(() => {});
  }, [showModal]);

  const filteredCoins = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!selectedCoin || !targetPrice) return;
    await authFetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coinId: selectedCoin.id, targetPrice: parseFloat(targetPrice), condition }),
    });
    setShowModal(false);
    setSelectedCoin(null);
    setTargetPrice('');
    setSearch('');
    fetchAlerts();
  };

  const handleDelete = async (id: number) => {
    await authFetch(`/api/alerts/${id}`, { method: 'DELETE' });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
        Alarmları görmek için giriş yapmalısınız.
      </div>
    );
  }

  const active = alerts.filter(a => !a.triggered);
  const triggered = alerts.filter(a => a.triggered);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Fiyat Alarmları</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Coin belirli fiyata ulaştığında bildirim al
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 14px rgba(59,130,246,0.35)' }}
        >
          + Yeni Alarm
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</div>
      ) : (
        <>
          {active.length === 0 && triggered.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-5xl mb-4">🔔</div>
              <p>Henüz alarm oluşturmadınız.</p>
            </div>
          )}

          {active.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                Aktif ({active.length})
              </h2>
              <div className="space-y-3 mb-8">
                {active.map(alert => (
                  <AlertRow key={alert.id} alert={alert} symbol={symbol} convert={convert} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}

          {triggered.length > 0 && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                Tetiklendi ({triggered.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {triggered.map(alert => (
                  <AlertRow key={alert.id} alert={alert} symbol={symbol} convert={convert} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4" style={{ animation: 'modalPop .2s ease', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Yeni Fiyat Alarmı</h2>

            {!selectedCoin ? (
              <>
                <input
                  type="text"
                  placeholder="Coin ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoComplete="off"
                  className="w-full px-4 py-2.5 rounded-xl text-sm mb-3"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <div className="overflow-y-auto max-h-64 space-y-1">
                  {filteredCoins.slice(0, 20).map(coin => (
                    <button key={coin.id} onClick={() => { setSelectedCoin(coin); setTargetPrice(coin.priceUsd?.toString() || ''); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left"
                      style={{ background: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <img src={coin.imageUrl} alt={coin.name} className="w-7 h-7 rounded-full" />
                      <span className="font-medium">{coin.name}</span>
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>{coin.symbol?.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <img src={selectedCoin.imageUrl} alt={selectedCoin.name} className="w-8 h-8 rounded-full" />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCoin.name}</span>
                  <button onClick={() => setSelectedCoin(null)} className="ml-auto text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Değiştir</button>
                </div>

                <div className="flex gap-2 mb-4">
                  {(['ABOVE', 'BELOW'] as const).map(c => (
                    <button key={c} onClick={() => setCondition(c)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{
                        background: condition === c ? (c === 'ABOVE' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'var(--bg-secondary)',
                        border: `1px solid ${condition === c ? (c === 'ABOVE' ? '#22c55e' : '#ef4444') : 'var(--border)'}`,
                        color: condition === c ? (c === 'ABOVE' ? '#22c55e' : '#ef4444') : 'var(--text-secondary)',
                      }}>
                      {c === 'ABOVE' ? '↑ Üzerine Çıkınca' : '↓ Altına Düşünce'}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Hedef Fiyat (USD)</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Güncel: ${selectedCoin.priceUsd?.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setShowModal(false); setSelectedCoin(null); setSearch(''); }}
                    className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    İptal
                  </button>
                  <button onClick={handleCreate}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    Alarm Oluştur
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, symbol, convert, onDelete }: {
  alert: Alert;
  symbol: string;
  convert: (v: number) => number;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: `1px solid ${alert.triggered ? 'var(--border)' : (alert.condition === 'ABOVE' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)')}` }}>
      <img src={alert.coinImage} alt={alert.coinName} className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{alert.coinName}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Fiyat {alert.condition === 'ABOVE' ? '↑ üzerine çıkınca' : '↓ altına düşünce'}:&nbsp;
          <span className="font-semibold" style={{ color: alert.condition === 'ABOVE' ? '#22c55e' : '#ef4444' }}>
            {symbol}{convert(alert.targetPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      {alert.triggered && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
          Tetiklendi
        </span>
      )}
      <button onClick={() => onDelete(alert.id)}
        className="text-xs px-3 py-1.5 rounded-lg cursor-pointer flex-shrink-0"
        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
        Sil
      </button>
    </div>
  );
}
