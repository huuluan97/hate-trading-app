import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

const CRYPTO_IDS = [
  'ethereum',
  'bitcoin',
  'binancecoin',
  'tether',
  'usd-coin',
  'dai',
  'wrapped-bitcoin',
  'chainlink',
  'uniswap',
  'aave',
];

class PriceService {
  private priceCache: Map<string, { data: CryptoPrice; timestamp: number }> =
    new Map();
  private cacheTimeout = 30000;

  async getPrices(cryptoIds: string[] = CRYPTO_IDS): Promise<CryptoPrice[]> {
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: cryptoIds.join(','),
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return this.getCachedPrices();
    }
  }

  async getPrice(cryptoId: string): Promise<CryptoPrice | null> {
    const cached = this.priceCache.get(cryptoId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: cryptoId,
          order: 'market_cap_desc',
          per_page: 1,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });

      const data = response.data[0];
      if (data) {
        this.priceCache.set(cryptoId, { data, timestamp: Date.now() });
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching price for ${cryptoId}:`, error);
      return cached?.data || null;
    }
  }

  private getCachedPrices(): CryptoPrice[] {
    const cached: CryptoPrice[] = [];
    this.priceCache.forEach((value) => {
      cached.push(value.data);
    });
    return cached;
  }

  getSymbolToId(symbol: string): string {
    const mapping: Record<string, string> = {
      ETH: 'ethereum',
      BTC: 'bitcoin',
      BNB: 'binancecoin',
      USDT: 'tether',
      USDC: 'usd-coin',
      DAI: 'dai',
      WBTC: 'wrapped-bitcoin',
      LINK: 'chainlink',
      UNI: 'uniswap',
      AAVE: 'aave',
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  async getETHPrice(): Promise<number> {
    const ethData = await this.getPrice('ethereum');
    return ethData?.current_price || 0;
  }

  async getTokenValueUSD(symbol: string, amount: number): Promise<number> {
    const coinId = this.getSymbolToId(symbol);
    const priceData = await this.getPrice(coinId);

    if (priceData) {
      return amount * priceData.current_price;
    }

    return 0;
  }

  clearCache(): void {
    this.priceCache.clear();
  }
}

export const priceService = new PriceService();
