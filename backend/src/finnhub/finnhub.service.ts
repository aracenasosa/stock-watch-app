import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FinnhubQuote, FinnhubSymbol } from './types/finnhub.types';

@Injectable()
export class FinnhubService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly http: HttpService) {
    this.baseUrl = process.env.FINNHUB_BASE_URL ?? 'https://finnhub.io/api/v1';
    this.apiKey = process.env.FINNHUB_API_KEY ?? '';
    if (!this.apiKey) {
      console.warn('[FinnhubService] FINNHUB_API_KEY is missing');
    }
  }

  private async get<T>(path: string, params: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.get<T>(`${this.baseUrl}${path}`, {
          params: { ...params, token: this.apiKey },
        }),
      );
      return res.data;
    } catch (err: any) {
      throw new ServiceUnavailableException(
        err?.response?.data?.error ?? 'Finnhub request failed',
      );
    }
  }

  // GET /stock/symbol?exchange=US
  async listSymbols(exchange = 'US'): Promise<FinnhubSymbol[]> {
    return this.get<FinnhubSymbol[]>('/stock/symbol', { exchange });
  }

  // GET /quote?symbol=AAPL
  async getQuote(symbol: string): Promise<FinnhubQuote> {
    return this.get<FinnhubQuote>('/quote', { symbol });
  }
}
