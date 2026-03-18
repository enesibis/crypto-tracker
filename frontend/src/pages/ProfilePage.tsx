import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { email, authFetch, isLoggedIn } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
        Profil görüntülemek için giriş yapmalısınız.
      </div>
    );
  }

  const handleChangePassword = async () => {
    if (!current || !next || !confirm) { setMsg({ type: 'err', text: 'Tüm alanları doldurun.' }); return; }
    if (next !== confirm) { setMsg({ type: 'err', text: 'Yeni şifreler eşleşmiyor.' }); return; }
    if (next.length < 6) { setMsg({ type: 'err', text: 'Şifre en az 6 karakter olmalı.' }); return; }
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        setMsg({ type: 'ok', text: 'Şifre başarıyla değiştirildi.' });
        setCurrent(''); setNext(''); setConfirm('');
      } else {
        const data = await res.json();
        setMsg({ type: 'err', text: data.error || 'Bir hata oluştu.' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Sunucuya ulaşılamadı.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Profil</h1>

      {/* Kullanıcı Bilgisi */}
      <div className="rounded-2xl p-5 mb-6 flex items-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {email?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{email}</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Üye</div>
        </div>
      </div>

      {/* Şifre Değiştir */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Şifre Değiştir</h2>

        {msg && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
            }}>
            {msg.text}
          </div>
        )}

        <div className="space-y-3">
          {[
            { label: 'Mevcut Şifre', value: current, onChange: setCurrent },
            { label: 'Yeni Şifre', value: next, onChange: setNext },
            { label: 'Yeni Şifre (Tekrar)', value: confirm, onChange: setConfirm },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <input
                type="password"
                value={value}
                onChange={e => { onChange(e.target.value); setMsg(null); }}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
        </button>
      </div>
    </div>
  );
}
