import { Injectable } from '@nestjs/common';
import { FinnhubService } from '../finnhub/finnhub.service';

type QuoteResult =
  | { symbol: string; ok: true; data: any }
  | { symbol: string; ok: false; error: string };

@Injectable()
export class MarketService {
  constructor(private readonly finnhub: FinnhubService) {}

  private normalize(symbol: string) {
    return symbol.trim().toUpperCase();
  }

  async getBatchQuotes(
    symbols: string[],
    concurrency = 5,
  ): Promise<QuoteResult[]> {
    const normalized = [
      ...new Set(symbols.map((s) => this.normalize(s)).filter(Boolean)),
    ];

    const results: QuoteResult[] = [];
    let i = 0;

    const worker = async () => {
      while (i < normalized.length) {
        const idx = i++;
        const symbol = normalized[idx];

        try {
          const data = await this.finnhub.getQuote(symbol);
          results[idx] = { symbol, ok: true, data };
        } catch (e: any) {
          results[idx] = {
            symbol,
            ok: false,
            error: e?.response?.data?.error ?? e?.message ?? 'Quote failed',
          };
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, normalized.length) }, worker),
    );

    return results;
  }
}
