import { Injectable } from '@nestjs/common';
import { FinnhubService } from '../finnhub/finnhub.service';
import {
  FinnhubCandles,
  FinnhubQuote,
  FinnhubSymbol,
} from '../finnhub/types/finnhub.types';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

type QuoteResult =
  | { symbol: string; ok: true; data: any }
  | { symbol: string; ok: false; error: string };

@Injectable()
export class MarketService {
  constructor(
    private readonly finnhub: FinnhubService,
    private readonly http: HttpService,
  ) {}

  private readonly baseUrl =
    process.env.FINNHUB_BASE_URL ?? 'https://finnhub.io/api/v1';
  private readonly apiKey = process.env.FINNHUB_API_KEY ?? '';

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

  async getQuote(symbol: string): Promise<FinnhubQuote> {
    const sym = symbol.trim().toUpperCase();

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/quote`, {
        params: { symbol: sym, token: this.apiKey },
      }),
    );

    return data;
  }
}
