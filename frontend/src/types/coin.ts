export interface Coin {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  priceUsd: number;
  marketCapUsd: number;
  volume24hUsd: number;
  priceChange24h: number;
  lastUpdated: string;
}
