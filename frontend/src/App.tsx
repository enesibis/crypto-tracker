import { Routes, Route, useNavigate } from 'react-router-dom';
import CoinTable from './components/CoinTable';
import CoinDetailPage from './pages/CoinDetailPage';
import AuthPage from './pages/AuthPage';
import PortfolioPage from './pages/PortfolioPage';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './context/AuthContext';
import IbisPulseLogo from './components/IbisPulseLogo';
import FloatingCoins from './components/FloatingCoins';
import GlobalMarketBar from './components/GlobalMarketBar';

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

export default function App() {
  const { theme, toggle } = useTheme();
  const { isLoggedIn, email, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <FloatingCoins />

      <header className="glass-header">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <IbisPulseLogo />
          </div>

          <div className="flex items-center gap-2">
            {/* Portfolio linki */}
            {isLoggedIn && (
              <button onClick={() => navigate('/portfolio')}
                className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Portfolio
              </button>
            )}

            {/* Tema butonu */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Aydınlık' : 'Karanlık'}</span>
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    {email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    {email}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); window.location.href = '/'; }}
                  className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--negative)' }}
                >
                  Çıkış
                </button>
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
            <Route path="/" element={<CoinTable />} />
            <Route path="/coin/:coinId" element={<CoinDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
