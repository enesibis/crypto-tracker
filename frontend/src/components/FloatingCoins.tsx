import { useEffect, useState, useRef } from 'react';
import type { Coin } from '../types/coin';

interface Particle {
  id: string;
  coin: Coin;
  x: number;       // başlangıç x (vw)
  y: number;       // başlangıç y (vh)
  size: number;    // px
  opacity: number;
  duration: number; // saniye
  delay: number;    // saniye
  driftX: number;  // yatay sürüklenme (vw)
  rotate: number;  // derece
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function FloatingCoins() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/coins?page=0&size=30&sortBy=marketCapUsd&sortDir=desc')
      .then(r => r.json())
      .then(data => {
        const coins: Coin[] = data.content ?? [];
        // top coin'leri al, her birinden 1-2 partikel oluştur
        const list: Particle[] = [];
        const picked = coins.slice(0, 20);

        picked.forEach((coin, i) => {
          const count = i < 8 ? 2 : 1; // ilk 8 coin 2'şer kez çıksın
          for (let k = 0; k < count; k++) {
            list.push({
              id: `${coin.id}-${k}`,
              coin,
              x: randomBetween(0, 95),
              y: randomBetween(100, 160),   // ekran altından başlar
              size: randomBetween(22, 52),
              opacity: randomBetween(0.06, 0.18),
              duration: randomBetween(18, 38),
              delay: randomBetween(0, 20) * -1, // negatif delay = hemen başlar
              driftX: randomBetween(-8, 8),
              rotate: randomBetween(-30, 30),
            });
          }
        });

        setParticles(list);
      })
      .catch(() => {/* sessizce geç */});
  }, []);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map(p => (
        <img
          key={p.id}
          src={p.coin.imageUrl}
          alt=""
          width={p.size}
          height={p.size}
          style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            borderRadius: '50%',
            filter: 'blur(0.4px)',
            animation: `floatUp ${p.duration}s ${p.delay}s linear infinite`,
            '--drift-x': `${p.driftX}vw`,
            '--rotate': `${p.rotate}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
