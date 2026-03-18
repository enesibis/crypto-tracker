import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'TRY';

const SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', TRY: '₺' };

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  symbol: string;
  convert: (usdValue: number) => number;
  rates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  symbol: '$',
  convert: (v) => v,
  rates: { USD: 1, EUR: 0.92, TRY: 32.5 },
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem('ibispulse_currency') as Currency) || 'USD'
  );
  const [rates, setRates] = useState<Record<Currency, number>>({ USD: 1, EUR: 0.92, TRY: 32.5 });

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data?.rates) {
          setRates({ USD: 1, EUR: data.rates.EUR ?? 0.92, TRY: data.rates.TRY ?? 32.5 });
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('ibispulse_currency', c);
  };

  const convert = (usdValue: number) => usdValue * rates[currency];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: SYMBOLS[currency], convert, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
