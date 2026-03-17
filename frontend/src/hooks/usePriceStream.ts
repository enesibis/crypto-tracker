import { useEffect, useRef, useState } from 'react';

type Status = 'connecting' | 'live' | 'disconnected';

export function usePriceStream(onUpdate: () => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/prices/stream');
      esRef.current = es;

      es.addEventListener('connected', () => setStatus('live'));

      es.addEventListener('prices-updated', () => {
        onUpdateRef.current();
      });

      es.onerror = () => {
        setStatus('disconnected');
        es.close();
        // 10 saniye sonra yeniden bağlan
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
