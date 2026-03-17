import { useEffect, useState } from 'react';

interface GlobalMarketData {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  marketCapChangePercentage24h: number;
}

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

interface StatPillProps {
  label: string;
  value: string;
  valueColor?: string;
  badge?: { text: string; positive: boolean };
  icon?: React.ReactNode;
}

function StatPill({ label, value, valueColor, badge, icon }: StatPillProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 14px',
      borderRadius: 999,
      background: 'var(--bg-hover)',
      border: '1px solid var(--border)',
      whiteSpace: 'nowrap',
    }}>
      {icon && <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: valueColor ?? 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>
        {value}
      </span>
      {badge && (
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 6,
          background: badge.positive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
          color: badge.positive ? 'var(--positive)' : 'var(--negative)',
          border: `1px solid ${badge.positive ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
        }}>
          {badge.positive ? '▲' : '▼'} {badge.text}
        </span>
      )}
    </div>
  );
}

function BtcIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f7931a">
      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

export default function GlobalMarketBar() {
  const [data, setData] = useState<GlobalMarketData | null>(null);

  useEffect(() => {
    fetch('/api/market/global')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.totalMarketCapUsd === 0) return null;

  const change = data.marketCapChangePercentage24h;
  const isPositive = change >= 0;

  return (
    <div className="market-bar" style={{
      position: 'relative',
      zIndex: 10,
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      {/* subtle top glow line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1152,
        margin: '0 auto',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {/* Live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 4, flexShrink: 0 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--positive)',
            boxShadow: '0 0 6px var(--positive)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Piyasa
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        <StatPill
          label="Piyasa Değeri"
          value={formatLargeNumber(data.totalMarketCapUsd)}
          icon={<GlobeIcon />}
          badge={{ text: `${Math.abs(change).toFixed(2)}%`, positive: isPositive }}
        />

        <StatPill
          label="24s Hacim"
          value={formatLargeNumber(data.totalVolumeUsd)}
          icon={<VolumeIcon />}
        />

        <StatPill
          label="BTC Dom."
          value={`${data.btcDominance.toFixed(1)}%`}
          valueColor="#f7931a"
          icon={<BtcIcon />}
        />
      </div>
    </div>
  );
}
