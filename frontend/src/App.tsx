import { Routes, Route, useNavigate } from 'react-router-dom';
import CoinTable from './components/CoinTable';
import CoinDetailPage from './pages/CoinDetailPage';
import AuthPage from './pages/AuthPage';
import PortfolioPage from './pages/PortfolioPage';
import AlertsPage from './pages/AlertsPage';
import ComparePage from './pages/ComparePage';
import ProfilePage from './pages/ProfilePage';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './context/AuthContext';
import { useCurrency, type Currency } from './context/CurrencyContext';
import IbisPulseLogo from './components/IbisPulseLogo';
import FloatingCoins from './components/FloatingCoins';
import GlobalMarketBar from './components/GlobalMarketBar';
import TrendingSection from './components/TrendingSection';
import FearGreedWidget from './components/FearGreedWidget';
import { useState, useEffect, useRef } from 'react';

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

const CURRENCIES: Currency[] = ['USD', 'EUR', 'TRY'];

export default function App() {
  const { theme, toggle } = useTheme();
  const { isLoggedIn, email, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <FloatingCoins />

      <header className="glass-header">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <IbisPulseLogo />
          </div>

          <div className="flex items-center gap-2">
            {/* Nav Linkleri */}
            {isLoggedIn && (
              <>
                <button onClick={() => navigate('/portfolio')}
                  className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer hidden sm:block"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Portfolio
                </button>
                <button onClick={() => navigate('/alerts')}
                  className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer hidden sm:block"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Alarmlar
                </button>
              </>
            )}
            <button onClick={() => navigate('/compare')}
              className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer hidden sm:block"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Karşılaştır
            </button>

            {/* Döviz Seçici */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {CURRENCIES.map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  className="px-2.5 py-2 text-xs font-semibold cursor-pointer"
                  style={{
                    background: currency === c ? 'var(--accent)' : 'var(--bg-card)',
                    color: currency === c ? '#fff' : 'var(--text-secondary)',
                    borderRight: c !== 'TRY' ? '1px solid var(--border)' : 'none',
                  }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Tema butonu */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(m => !m)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    {email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    {email}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ color: 'var(--accent)', transform: showUserMenu ? 'rotate(180deg)' : '' }}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1.5 rounded-2xl overflow-hidden shadow-xl z-50 min-w-44"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'modalPop 0.15s ease' }}>
                    <button onClick={() => { navigate('/portfolio'); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm cursor-pointer"
                      style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Portfolio
                    </button>
                    <button onClick={() => { navigate('/alerts'); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm cursor-pointer"
                      style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Fiyat Alarmları
                    </button>
                    <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm cursor-pointer"
                      style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Profil
                    </button>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); window.location.href = '/'; }}
                      className="w-full px-4 py-3 text-left text-sm cursor-pointer"
                      style={{ color: 'var(--negative)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 14px rgba(59,130,246,0.35)' }}
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      <GlobalMarketBar />

      <div className="max-w-6xl mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
                  <div className="lg:col-span-2 flex flex-col"><TrendingSection /></div>
                  <div className="flex flex-col"><FearGreedWidget /></div>
                </div>
                <CoinTable />
              </>
            } />
            <Route path="/coin/:coinId" element={<CoinDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
