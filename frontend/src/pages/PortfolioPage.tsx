import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

interface PortfolioEntry {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImageUrl: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

interface ModalState {
  coinId: string;
  coinName: string;
  coinImageUrl: string;
  quantity: string;
  buyPrice: string;
}

function formatPrice(n: number): string {
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(6);
}

function formatLarge(n: number, sym = '$'): string {
  if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${sym}${(n / 1e3).toFixed(2)}K`;
  return `${sym}${formatPrice(n)}`;
}

interface SnapshotPoint { date: string; value: number; }

export default function PortfolioPage() {
  const { authFetch, isLoggedIn } = useAuth();
  const { symbol, convert } = useCurrency();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    authFetch('/api/portfolio')
      .then(r => r.json())
      .then(setEntries)
      .finally(() => setLoading(false));
    authFetch('/api/portfolio/history')
      .then(r => r.json())
      .then((data: { date: string; value: number }[]) => {
        setSnapshots(data.map(s => ({
          date: new Date(s.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
          value: s.value,
        })));
      })
      .catch(() => {});
  }, [isLoggedIn, authFetch]);

  async function handleSave() {
    if (!modal) return;
    const qty = parseFloat(modal.quantity);
    const price = parseFloat(modal.buyPrice);
    if (!qty || !price || qty <= 0 || price <= 0) { setError('Geçerli bir miktar ve fiyat girin.'); return; }
    setSaving(true);
    setError('');
    const res = await authFetch('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ coinId: modal.coinId, quantity: qty, buyPrice: price }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? 'Hata oluştu.'); return; }
    setEntries(prev => {
      const idx = prev.findIndex(e => e.coinId === data.coinId);
      if (idx >= 0) { const next = [...prev]; next[idx] = data; return next; }
      return [...prev, data];
    });
    setModal(null);
  }

  async function handleDelete(coinId: string) {
    await authFetch(`/api/portfolio/${coinId}`, { method: 'DELETE' });
    setEntries(prev => prev.filter(e => e.coinId !== coinId));
  }

  const totalValue = entries.reduce((s, e) => s + e.currentValue, 0);
  const totalCost = entries.reduce((s, e) => s + e.quantity * e.buyPrice, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPos = totalPnl >= 0;

  const chartData = snapshots.map(s => ({ ...s, value: convert(s.value) }));
  const chartMin = chartData.length > 0 ? Math.min(...chartData.map(s => s.value)) * 0.98 : 0;
  const chartMax = chartData.length > 0 ? Math.max(...chartData.map(s => s.value)) * 1.02 : 0;

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>Portfolio takibi için giriş yapmanız gerekiyor.</p>
        <button onClick={() => navigate('/auth')}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          Giriş Yap
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Özet kartlar */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Toplam Değer', value: formatLarge(convert(totalValue), symbol), accent: false },
            { label: 'Toplam Maliyet', value: formatLarge(convert(totalCost), symbol), accent: false },
            { label: 'Kar / Zarar', value: `${totalPnl >= 0 ? '+' : ''}${formatLarge(convert(Math.abs(totalPnl)), symbol)}`, accent: true, pos: isPos },
            { label: 'Değişim', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`, accent: true, pos: isPos },
          ].map(({ label, value, accent, pos }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-lg font-bold"
                style={{ color: accent ? (pos ? 'var(--positive)' : 'var(--negative)') : 'var(--text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Portfolio Geçmişi Grafiği */}
      {chartData.length > 1 && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Portfolio Geçmişi</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[chartMin, chartMax]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false}
                tickFormatter={v => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                formatter={(v: number) => [`${symbol}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Değer']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2}
                fill="url(#portfolioGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tablo */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="px-4 py-3.5 text-left text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Coin</th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Miktar</th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Alış Fiyatı</th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Güncel Fiyat</th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Değer</th>
              <th className="px-4 py-3.5 text-right text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>K/Z</th>
              <th className="px-4 py-3.5 w-20" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="skeleton h-4 rounded" style={{ width: j === 0 ? 120 : 60, marginLeft: j > 0 ? 'auto' : 0 }} /></td>
                  ))}
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Henüz portfolio girişi yok. Coin detay sayfasından ekleyebilirsiniz.
                </td>
              </tr>
            ) : (
              entries.map(e => {
                const pos = e.pnl >= 0;
                return (
                  <tr key={e.coinId} className="coin-row"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={el => (el.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/coin/${e.coinId}`)}>
                        <img src={e.coinImageUrl} alt={e.coinName} className="w-7 h-7 rounded-full" />
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{e.coinName}</p>
                          <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>{e.coinSymbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {e.quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      ${formatPrice(e.buyPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      ${formatPrice(e.currentPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${formatPrice(e.currentValue)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: pos ? 'var(--positive)' : 'var(--negative)' }}>
                          {pos ? '+' : ''}{formatLarge(Math.abs(e.pnl))}
                        </p>
                        <p className="text-xs" style={{ color: pos ? 'var(--positive)' : 'var(--negative)' }}>
                          {pos ? '+' : ''}{e.pnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ coinId: e.coinId, coinName: e.coinName, coinImageUrl: e.coinImageUrl, quantity: String(e.quantity), buyPrice: String(e.buyPrice) })}
                          className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
                          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                          title="Düzenle">
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(e.coinId)}
                          className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
                          style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--negative)' }}
                          title="Sil">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'modalPop 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <img src={modal.coinImageUrl} alt={modal.coinName} className="w-9 h-9 rounded-full" />
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{modal.coinName} — Portfolio</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Miktar</label>
                <input type="number" min="0" step="any" value={modal.quantity}
                  onChange={e => setModal(m => m ? { ...m, quantity: e.target.value } : m)}
                  placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Alış Fiyatı (USD)</label>
                <input type="number" min="0" step="any" value={modal.buyPrice}
                  onChange={e => setModal(m => m ? { ...m, buyPrice: e.target.value } : m)}
                  placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--negative)' }}>{error}</p>}
              <div className="flex gap-2 mt-1">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  İptal
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
