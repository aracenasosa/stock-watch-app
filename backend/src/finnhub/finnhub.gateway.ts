import {
  UseGuards,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';
import { MarketService } from 'src/market/market.service';
import { AlertsService } from 'src/alerts/alerts.service';

// Extended WebSocket type to include the authenticated user payload
export interface AuthenticatedWebSocket extends WebSocket {
  user?: { sub: string };
}

type ClientMsg =
  | { type: 'subscribe'; symbol: string }
  | { type: 'unsubscribe'; symbol: string };

@WebSocketGateway({ path: '/ws' })
@UseGuards(WsJwtGuard)
export class FinnhubGateway
  implements
    OnModuleInit,
    OnModuleDestroy,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  private readonly logger = new Logger(FinnhubGateway.name);

  @WebSocketServer()
  server?: { clients: Set<AuthenticatedWebSocket> };

  private finnhubWs?: WebSocket;

  private readonly apiKey = process.env.FINNHUB_API_KEY ?? '';
  private readonly finnhubBaseWs =
    process.env.FINNHUB_WS_URL ?? 'wss://ws.finnhub.io';

  private isConnected = false;

  // What we tell Finnhub to stream (global)
  private finnhubSubs = new Set<string>();

  // What each app client wants
  private clientSubs = new Map<AuthenticatedWebSocket, Set<string>>();

  // Fallback polling interval
  private quoteInterval?: NodeJS.Timeout;

  // Track last WS trade per symbol to optionally skip polling
  private lastTradeAt = new Map<string, number>();

  constructor(
    private readonly market: MarketService,
    private readonly alerts: AlertsService,
    private readonly wsJwtGuard: WsJwtGuard,
  ) {}

  // Env helpers
  private envBool(name: string, def: boolean) {
    const raw = (process.env[name] ?? '').trim().toLowerCase();
    if (!raw) return def;
    return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'y';
  }

  private envInt(name: string, def: number) {
    const raw = (process.env[name] ?? '').trim();
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : def;
  }

  // Lifecycle
  async onModuleInit() {
    this.connectFinnhub();

    // Initial load of alert symbols
    await this.refreshGlobalSubs();

    // Periodically refresh global subs to catch any new alerts or cleanup old ones
    setInterval(() => this.refreshGlobalSubs(), 5 * 60 * 1000); // Every 5 mins

    const enabled = this.envBool('QUOTE_FALLBACK_ENABLED', true);
    if (enabled) this.startQuoteFallback();
    else this.logger.log('Quote fallback polling disabled via env');
  }

  /**
   * Queries the AlertsService for all symbols that have active alerts
   * and ensures the Gateway is subscribed to them on Finnhub.
   */
  private async refreshGlobalSubs() {
    try {
      const alertSymbols = await this.alerts.getUniqueAlertSymbols();
      this.logger.log(
        `[FINNHUB] Refreshing global alert subs: ${alertSymbols.length} symbols`,
      );

      for (const sym of alertSymbols) {
        if (!this.finnhubSubs.has(sym)) {
          this.finnhubSubs.add(sym);
          if (this.finnhubWs && this.isConnected) {
            this.finnhubWs.send(
              JSON.stringify({ type: 'subscribe', symbol: sym }),
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to refresh global alert subs', error);
    }
  }

  onModuleDestroy() {
    this.stopQuoteFallback();
    try {
      this.finnhubWs?.close();
    } catch {}
  }
  // Gateway connection
  async handleConnection(client: AuthenticatedWebSocket, req: IncomingMessage) {
    // In NestJS with WsAdapter (ws library), the second argument is the IncomingMessage (request)
    const url =
      req?.url || (client as any)?.url || (client as any)?.upgradeReq?.url;

    try {
      // Enforce authentication during initial handshake
      const user = await this.wsJwtGuard.validateToken(url);
      client.user = user;

      this.logger.log(`[WS] Authenticated connection: ${user.sub}`);

      if (!this.clientSubs.has(client)) this.clientSubs.set(client, new Set());

      client.on('message', (raw: Buffer) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw.toString());
        } catch {
          client.send(
            JSON.stringify({ type: 'error', message: 'Invalid JSON' }),
          );
          return;
        }

        if (!this.isClientMsg(parsed)) {
          client.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            }),
          );
          return;
        }

        this.handleClientMessage(parsed, client);
      });
    } catch (e: any) {
      // Reject unauthorized connection
      this.logger.warn(
        `[WS] Unauthorized connection attempt rejected: ${e.message}`,
      );
      client.send(
        JSON.stringify({
          type: 'error',
          message: e.message || 'Unauthorized',
        }),
      );
      // Close connection after a small delay to ensure message is sent
      setTimeout(() => client.close(1008, 'Policy Violation'), 100);
    }
  }

  async handleDisconnect(client: AuthenticatedWebSocket) {
    this.clientSubs.delete(client);
    await this.cleanupFinnhubSubs();
  }

  private isClientMsg(v: unknown): v is ClientMsg {
    if (!v || typeof v !== 'object') return false;
    const obj = v as any;
    return (
      (obj.type === 'subscribe' || obj.type === 'unsubscribe') &&
      typeof obj.symbol === 'string'
    );
  }

  // Finnhub WS (Trades)
  private connectFinnhub() {
    if (!this.apiKey) {
      this.logger.warn('FINNHUB_API_KEY missing, Finnhub WS disabled');
      return;
    }

    const url = `${this.finnhubBaseWs}?token=${this.apiKey}`;
    this.finnhubWs = new WebSocket(url);

    this.finnhubWs.on('open', () => {
      this.isConnected = true;
      this.logger.log('[FINNHUB] connected');

      // Re-subscribe after reconnect
      for (const sym of this.finnhubSubs) {
        this.finnhubWs?.send(
          JSON.stringify({ type: 'subscribe', symbol: sym }),
        );
      }
    });

    this.finnhubWs.on('message', (raw) => {
      const msg = raw.toString();
      this.handleFinnhubMessage(msg);
      this.logger.log(`[FINNHUB] msg ${msg.slice(0, 200)}`);
    });

    this.finnhubWs.on('close', () => {
      this.isConnected = false;
      this.logger.warn('[FINNHUB] disconnected - retrying in 1500ms');
      setTimeout(() => this.connectFinnhub(), 1500);
    });

    this.finnhubWs.on('error', () => {
      this.isConnected = false;
      try {
        this.finnhubWs?.close();
      } catch {}
    });
  }

  private handleFinnhubMessage(message: string) {
    let parsed: any;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    // ignore ping and non-trade
    if (parsed?.type !== 'trade' || !Array.isArray(parsed.data)) return;

    for (const trade of parsed.data) {
      const symbol: string | undefined = trade?.s;
      const price: number | undefined = trade?.p;
      const ts: number | undefined = trade?.t;

      if (!symbol || typeof price !== 'number' || typeof ts !== 'number')
        continue;

      // mark this symbol as "ticks flowing"
      this.lastTradeAt.set(symbol, Date.now());

      const payload = JSON.stringify({ type: 'tick', symbol, price, ts });

      this.sendToSubscribers(symbol, payload);

      // Evaluate alerts from WS ticks too
      void this.alerts.evaluateTick(symbol, price);
    }
  }

  // Quote fallback (polling)
  private startQuoteFallback() {
    if (this.quoteInterval) return;

    const intervalMs = this.envInt('QUOTE_FALLBACK_MS', 10_000);
    const skipEnabled = this.envBool('QUOTE_SKIP_IF_TICK_ENABLED', true);
    const skipWithinMs = this.envInt('QUOTE_SKIP_IF_TICK_WITHIN_MS', 15_000);

    this.quoteInterval = setInterval(async () => {
      const symbols = Array.from(this.finnhubSubs);
      if (symbols.length === 0) return;

      const now = Date.now();

      for (const symbol of symbols) {
        const lastTrade = this.lastTradeAt.get(symbol);

        // If real ticks were flowing recently, skip polling for this symbol
        if (skipEnabled && lastTrade && now - lastTrade < skipWithinMs) {
          continue;
        }

        try {
          const quote = await this.market.getQuote(symbol);
          const price = quote?.c;

          if (typeof price !== 'number' || !Number.isFinite(price)) continue;

          const payload = JSON.stringify({
            type: 'quote',
            symbol,
            price,
            prevClose: quote.pc,
            ts: Date.now(),
            source: 'poll',
          });

          this.sendToSubscribers(symbol, payload);

          // Alerts still work even if WS is quiet
          await this.alerts.evaluateTick(symbol, price);
        } catch {
          // never crash gateway due to polling
        }
      }
    }, intervalMs);

    this.logger.log(
      `Quote fallback enabled interval=${intervalMs}ms skipEnabled=${skipEnabled} skipWithinMs=${skipWithinMs}ms`,
    );
  }

  private stopQuoteFallback() {
    if (!this.quoteInterval) return;
    clearInterval(this.quoteInterval);
    this.quoteInterval = undefined;
    this.logger.log('Quote fallback polling stopped');
  }

  // Client messages
  private async handleClientMessage(
    body: ClientMsg,
    client: AuthenticatedWebSocket,
  ) {
    const symbol = body.symbol.trim().toUpperCase();
    if (!symbol) return;

    const subs = this.ensureClientSubs(client);

    if (body.type === 'subscribe') {
      subs.add(symbol);

      // Subscribe Finnhub only once globally
      if (!this.finnhubSubs.has(symbol)) {
        this.finnhubSubs.add(symbol);

        if (this.finnhubWs && this.isConnected) {
          this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
      }

      client.send(JSON.stringify({ type: 'subscribed', symbol }));
    }

    if (body.type === 'unsubscribe') {
      subs.delete(symbol);
      client.send(JSON.stringify({ type: 'unsubscribed', symbol }));
      await this.cleanupFinnhubSubs();
    }
  }

  private ensureClientSubs(client: AuthenticatedWebSocket) {
    if (!this.clientSubs.has(client)) {
      this.clientSubs.set(client, new Set<string>());
    }
    return this.clientSubs.get(client)!;
  }

  private async cleanupFinnhubSubs() {
    const needed = new Set<string>();

    // 1. Symbols needed by connected clients
    for (const subs of this.clientSubs.values()) {
      for (const sym of subs) needed.add(sym);
    }

    // 2. Symbols with active alerts (must stay monitored)
    try {
      const alertSymbols = await this.alerts.getUniqueAlertSymbols();
      for (const sym of alertSymbols) needed.add(sym);
    } catch (e) {
      this.logger.error('Failed to fetch alert symbols during cleanup', e);
    }

    for (const sym of Array.from(this.finnhubSubs)) {
      if (!needed.has(sym)) {
        this.finnhubSubs.delete(sym);
        this.lastTradeAt.delete(sym);

        if (this.finnhubWs && this.isConnected) {
          this.finnhubWs.send(
            JSON.stringify({ type: 'unsubscribe', symbol: sym }),
          );
        }
      }
    }
  }

  private sendToSubscribers(symbol: string, payload: string) {
    const clients = this.server?.clients;
    if (!clients) return;

    clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;
      const subs = this.clientSubs.get(client);
      if (subs?.has(symbol)) client.send(payload);
    });
  }
}
