import { useEffect, useRef, useState } from 'react';

type Status = 'connecting' | 'live' | 'disconnected';

interface AlertPayload {
  alertId: number;
  userEmail: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'ABOVE' | 'BELOW';
}

export function usePriceStream(onUpdate: () => void, userEmail?: string | null) {
  const [status, setStatus] = useState<Status>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const userEmailRef = useRef(userEmail);
  userEmailRef.current = userEmail;

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/prices/stream');
      esRef.current = es;

      es.addEventListener('connected', () => setStatus('live'));

      es.addEventListener('prices-updated', () => {
        onUpdateRef.current();
      });

      es.addEventListener('alert-triggered', (e: MessageEvent) => {
        try {
          const payload: AlertPayload = JSON.parse(e.data);
          if (payload.userEmail !== userEmailRef.current) return;

          // Browser notification
          const show = () => {
            const dir = payload.condition === 'ABOVE' ? '↑' : '↓';
            const title = `${payload.coinName} Fiyat Alarmı ${dir}`;
            const body = `${payload.coinName} (${payload.coinSymbol.toUpperCase()}) hedef fiyata ulaştı: $${payload.targetPrice.toLocaleString()}`;
            new Notification(title, { body, icon: payload.coinImage, tag: `alert-${payload.alertId}` });
          };

          if (Notification.permission === 'granted') {
            show();
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(perm => { if (perm === 'granted') show(); });
          }
        } catch {}
      });

      es.onerror = () => {
        setStatus('disconnected');
        es.close();
        setTimeout(connect, 10000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
    };
  }, []);

  return status;
}
