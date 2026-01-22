import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';
import WebSocket from 'ws';

type ClientMsg =
  | { type: 'subscribe'; symbol: string }
  | { type: 'unsubscribe'; symbol: string };

type ErrorMsg = { type: 'error'; message: string };

@WebSocketGateway({ path: '/ws' })
@UseGuards(WsJwtGuard)
export class FinnhubGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server?: { clients?: Set<WebSocket> };

  private finnhubWs?: WebSocket;
  private readonly apiKey = process.env.FINNHUB_API_KEY ?? '';
  private readonly finnhubBaseWs =
    process.env.FINNHUB_WS_URL ?? 'wss://ws.finnhub.io';

  private isConnected = false;

  // What we tell Finnhub to stream (unique symbols only once)
  private finnhubSubs = new Set<string>();

  // What each app client wants
  private clientSubs = new Map<WebSocket, Set<string>>();

  onModuleInit() {
    this.connectFinnhub();
  }

  handleConnection(client: WebSocket) {
    this.ensureClientSubs(client);

    client.on('message', (raw) => {
      const parsed = this.safeJsonParse(raw);
      if (!parsed) {
        this.safeSend(client, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      if (!this.isClientMsg(parsed)) {
        this.safeSend(client, {
          type: 'error',
          message:
            'Invalid message format. Expected { type: "subscribe"|"unsubscribe", symbol: string }',
        });
        return;
      }

      this.handleClientMessage(parsed, client);
    });
  }

  handleDisconnect(client: WebSocket) {
    this.clientSubs.delete(client);
    this.cleanupFinnhubSubs();
  }

  private safeJsonParse(raw: unknown): unknown | null {
    try {
      const str =
        typeof raw === 'string'
          ? raw
          : Buffer.isBuffer(raw)
            ? raw.toString('utf8')
            : String(raw);
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  private safeSend(client: WebSocket, msg: ErrorMsg | any) {
    if (client.readyState !== WebSocket.OPEN) return;
    try {
      client.send(JSON.stringify(msg));
    } catch {}
  }

  private isClientMsg(v: unknown): v is ClientMsg {
    if (!v || typeof v !== 'object') return false;
    const obj = v as any;
    return (
      (obj.type === 'subscribe' || obj.type === 'unsubscribe') &&
      typeof obj.symbol === 'string'
    );
  }

  private connectFinnhub() {
    if (!this.apiKey) return;

    const url = `${this.finnhubBaseWs}?token=${this.apiKey}`;
    this.finnhubWs = new WebSocket(url);

    this.finnhubWs.on('open', () => {
      this.isConnected = true;

      // Re-subscribe after reconnect
      for (const sym of this.finnhubSubs) {
        this.finnhubWs?.send(
          JSON.stringify({ type: 'subscribe', symbol: sym }),
        );
      }
    });

    this.finnhubWs.on('message', (raw) => {
      const msg = typeof raw === 'string' ? raw : raw.toString();
      this.handleFinnhubMessage(msg);
    });

    this.finnhubWs.on('close', () => {
      this.isConnected = false;
      setTimeout(() => this.connectFinnhub(), 1500);
    });

    this.finnhubWs.on('error', () => {
      this.isConnected = false;
      try {
        this.finnhubWs?.close();
      } catch {}
    });
  }

  private handleClientMessage(body: ClientMsg, client: WebSocket) {
    const symbol = body.symbol.trim().toUpperCase();
    if (!symbol) return;

    if (!this.finnhubWs || !this.isConnected) {
      this.safeSend(client, {
        type: 'error',
        message: 'Finnhub WS not connected yet',
      });
      return;
    }

    const subs = this.ensureClientSubs(client);

    if (body.type === 'subscribe') {
      subs.add(symbol);

      // Subscribe Finnhub only once globally
      if (!this.finnhubSubs.has(symbol)) {
        this.finnhubSubs.add(symbol);
        this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol }));
      }

      this.safeSend(client, { type: 'subscribed', symbol });
      return;
    }

    // unsubscribe
    subs.delete(symbol);
    this.safeSend(client, { type: 'unsubscribed', symbol });
    this.cleanupFinnhubSubs();
  }

  private handleFinnhubMessage(message: string) {
    let parsed: any;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    if (parsed?.type !== 'trade' || !Array.isArray(parsed.data)) return;

    for (const trade of parsed.data) {
      const symbol: string | undefined = trade?.s;
      const price: number | undefined = trade?.p;
      const ts: number | undefined = trade?.t;

      if (!symbol || typeof price !== 'number' || typeof ts !== 'number')
        continue;

      const payload = { type: 'tick', symbol, price, ts };
      this.sendToSubscribers(symbol, payload);
    }
  }

  private sendToSubscribers(symbol: string, payload: any) {
    const clients = this.server?.clients;
    if (!clients) return;

    const json = JSON.stringify(payload);

    clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      const subs = this.clientSubs.get(client);
      if (subs?.has(symbol)) {
        try {
          client.send(json);
        } catch {}
      }
    });
  }

  private ensureClientSubs(client: WebSocket) {
    const existing = this.clientSubs.get(client);
    if (existing) return existing;

    const created = new Set<string>();
    this.clientSubs.set(client, created);
    return created;
  }

  private cleanupFinnhubSubs() {
    // Build set of all symbols currently needed by any client
    const needed = new Set<string>();
    for (const subs of this.clientSubs.values()) {
      for (const sym of subs) needed.add(sym);
    }

    // Unsubscribe from Finnhub for anything not needed anymore
    for (const sym of Array.from(this.finnhubSubs)) {
      if (!needed.has(sym)) {
        this.finnhubSubs.delete(sym);
        if (this.finnhubWs && this.isConnected) {
          this.finnhubWs.send(
            JSON.stringify({ type: 'unsubscribe', symbol: sym }),
          );
        }
      }
    }
  }
}
