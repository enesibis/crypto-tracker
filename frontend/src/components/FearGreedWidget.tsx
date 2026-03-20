import { useEffect, useState } from 'react';

interface FGData {
  value: number;
  classification: string;
}

function getColor(value: number) {
  if (value <= 25) return '#ef4444';
  if (value <= 45) return '#f97316';
  if (value <= 55) return '#eab308';
  if (value <= 75) return '#84cc16';
  return '#22c55e';
}

function getLabel(classification: string) {
  const map: Record<string, string> = {
    'Extreme Fear': 'Aşırı Korku', 'Fear': 'Korku',
    'Neutral': 'Nötr', 'Greed': 'Açgözlülük', 'Extreme Greed': 'Aşırı Açgözlülük',
  };
  return map[classification] ?? classification;
}

function getDesc(value: number) {
  if (value <= 25) return 'Panik satışı var. Tarihsel olarak alım fırsatı olarak görülür.';
  if (value <= 45) return 'Piyasa temkinli, belirsizlik hâkim.';
  if (value <= 55) return 'Denge noktasında, net bir sinyal yok.';
  if (value <= 75) return 'İyimserlik yüksek, dikkatli olmak gerekir.';
  return 'Aşırı iyimserlik. Buffett: "Başkaları açgözlü olduğunda korkak ol."';
}

export default function FearGreedWidget() {
  const [data, setData] = useState<FGData | null>(null);

  useEffect(() => {
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .then(d => {
        const item = d?.data?.[0];
        if (item) setData({ value: parseInt(item.value), classification: item.value_classification });
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const color = getColor(data.value);
  const label = getLabel(data.classification);
  const desc = getDesc(data.value);

  // Arc gauge
  const R = 52, cx = 64, cy = 64;
  const circumference = Math.PI * R;
  const dashOffset = circumference - (data.value / 100) * circumference;

  return (
    <div className="rounded-2xl p-5 h-full flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Piyasa Duygusu</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>Korku & Açgözlülük</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: color + '20', color }}>
          Günlük
        </span>
      </div>

      {/* Gauge + değer */}
      <div className="flex items-center gap-5">
        <div style={{ position: 'relative', width: 128, height: 72, flexShrink: 0 }}>
          <svg width="128" height="72" viewBox="0 0 128 72" style={{ overflow: 'visible' }}>
            {/* Gradient segmentler */}
            {[
              { color: '#ef4444', start: 0,   end: 0.25 },
              { color: '#f97316', start: 0.25, end: 0.45 },
              { color: '#eab308', start: 0.45, end: 0.55 },
              { color: '#84cc16', start: 0.55, end: 0.75 },
              { color: '#22c55e', start: 0.75, end: 1 },
            ].map((seg, i) => {
              const segCirc = circumference;
              const segOffset = segCirc - seg.end * segCirc;
              const segLen = (seg.end - seg.start) * segCirc;
              return (
                <path key={i}
                  d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
                  fill="none" stroke={seg.color} strokeWidth="9" strokeLinecap="butt"
                  strokeDasharray={`${segLen} ${segCirc}`}
                  strokeDashoffset={segOffset}
                  style={{ opacity: 0.2 }}
                />
              );
            })}
            {/* Track */}
            <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
              fill="none" stroke="var(--border)" strokeWidth="9" strokeLinecap="round" />
            {/* Value arc */}
            <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
              fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                filter: `drop-shadow(0 0 6px ${color}80)` }} />
          </svg>
          {/* Değer */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', lineHeight: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-1px' }}>{data.value}</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xl font-bold mb-1" style={{ color }}>{label}</div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          {/* Mini skala */}
          <div className="mt-3 flex gap-1">
            {[
              { c: '#ef4444', l: 'Korku' },
              { c: '#f97316', l: '' },
              { c: '#eab308', l: 'Nötr' },
              { c: '#84cc16', l: '' },
              { c: '#22c55e', l: 'Açgözlülük' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: s.c,
                opacity: color === s.c ? 1 : 0.25,
                boxShadow: color === s.c ? `0 0 6px ${s.c}` : 'none',
                transition: 'all 0.3s' }} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Korku</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Açgözlülük</span>
          </div>
        </div>
      </div>

      {/* Seviye açıklamaları */}
      <div className="mt-4 space-y-1.5" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        {[
          { range: '0–25',   label: 'Aşırı Korku',      color: '#ef4444', desc: 'Panik satışı. Tarihsel olarak alım fırsatı sayılır.' },
          { range: '26–45',  label: 'Korku',             color: '#f97316', desc: 'Piyasa temkinli, yatırımcılar belirsiz.' },
          { range: '46–55',  label: 'Nötr',              color: '#eab308', desc: 'Denge noktası, net bir yön yok.' },
          { range: '56–75',  label: 'Açgözlülük',        color: '#84cc16', desc: 'İyimserlik hâkim, dikkatli olunmalı.' },
          { range: '76–100', label: 'Aşırı Açgözlülük', color: '#22c55e', desc: 'Balon riski yüksek. Düzeltme gelebilir.' },
        ].map(lvl => {
          const active = color === lvl.color;
          return (
            <div key={lvl.range} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10,
              background: active ? lvl.color + '14' : 'transparent',
              border: `1px solid ${active ? lvl.color + '40' : 'transparent'}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: lvl.color, flexShrink: 0,
                boxShadow: active ? `0 0 6px ${lvl.color}` : 'none' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: lvl.color }}>{lvl.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lvl.range}</span>
              </div>
              <span style={{ fontSize: 10, color: active ? 'var(--text-secondary)' : 'var(--text-muted)', marginLeft: 2 }}>
                {lvl.desc}
              </span>
              {active && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: lvl.color + '25', color: lvl.color, flexShrink: 0 }}>Şu an</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
