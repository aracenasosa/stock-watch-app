import { create } from "zustand";
import { WS_URL } from "@/shared/constants";
import type {
  WsMessage,
  WsClientMessage,
  TimeSeriesPoint,
} from "@/shared/types";

const MAX_TIME_SERIES_POINTS = 100;

interface MarketState {
  // Price data
  prices: Record<string, number>;
  prevPrices: Record<string, number>;
  timeSeries: Record<string, TimeSeriesPoint[]>;

  // Connection state
  isConnected: boolean;
  subscribedSymbols: Set<string>;

  // Internal
  ws: WebSocket | null;

  // Actions
  connect: (accessToken: string) => void;
  disconnect: () => void;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  subscribeMany: (symbols: string[]) => void;
  clearData: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},
  prevPrices: {},
  timeSeries: {},
  isConnected: false,
  subscribedSymbols: new Set(),
  ws: null,

  connect: (accessToken: string) => {
    const { ws: existingWs } = get();

    // Close existing connection if any
    if (existingWs) {
      existingWs.close();
    }

    const wsUrl = `${WS_URL}?token=${encodeURIComponent(accessToken)}`;
    console.log("[MarketStore] Connecting to WebSocket...");

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[MarketStore] WebSocket connected");
      set({ isConnected: true, ws });

      // Re-subscribe to all symbols
      const { subscribedSymbols } = get();
      subscribedSymbols.forEach((symbol) => {
        const msg: WsClientMessage = { type: "subscribe", symbol };
        ws.send(JSON.stringify(msg));
      });
    };

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);

        if (message.type === "tick" || message.type === "quote") {
          const { symbol, price, ts } = message;

          set((state) => {
            const currentPrice = state.prices[symbol];
            const newTimeSeries = [...(state.timeSeries[symbol] || [])];

            // Add new point to time series
            newTimeSeries.push({ x: ts, y: price });

            // Keep only last N points
            if (newTimeSeries.length > MAX_TIME_SERIES_POINTS) {
              newTimeSeries.shift();
            }

            return {
              prices: { ...state.prices, [symbol]: price },
              prevPrices: {
                ...state.prevPrices,
                [symbol]: currentPrice ?? price,
              },
              timeSeries: { ...state.timeSeries, [symbol]: newTimeSeries },
            };
          });
        } else if (message.type === "subscribed") {
          console.log(`[MarketStore] Subscribed to ${message.symbol}`);
        } else if (message.type === "unsubscribed") {
          console.log(`[MarketStore] Unsubscribed from ${message.symbol}`);
        } else if (message.type === "error") {
          console.error("[MarketStore] WS Error:", message.message);
        }
      } catch (error) {
        console.error("[MarketStore] Failed to parse message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[MarketStore] WebSocket error:", error);
      set({ isConnected: false });
    };

    ws.onclose = (event) => {
      console.log("[MarketStore] WebSocket closed:", event.code);
      set({ isConnected: false, ws: null });

      // Attempt reconnect after 3 seconds if we have an access token
      if (event.code !== 1000) {
        setTimeout(() => {
          const { isConnected: stillConnected } = get();
          if (!stillConnected) {
            console.log("[MarketStore] Attempting to reconnect...");
            get().connect(accessToken);
          }
        }, 3000);
      }
    };

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close(1000, "User disconnected");
      set({ ws: null, isConnected: false });
    }
  },

  subscribe: (symbol: string) => {
    const { ws, isConnected, subscribedSymbols } = get();

    const upperSymbol = symbol.toUpperCase();

    if (subscribedSymbols.has(upperSymbol)) {
      return; // Already subscribed
    }

    const newSubscribed = new Set(subscribedSymbols);
    newSubscribed.add(upperSymbol);
    set({ subscribedSymbols: newSubscribed });

    if (ws && isConnected) {
      const msg: WsClientMessage = { type: "subscribe", symbol: upperSymbol };
      ws.send(JSON.stringify(msg));
    }
  },

  unsubscribe: (symbol: string) => {
    const { ws, isConnected, subscribedSymbols } = get();

    const upperSymbol = symbol.toUpperCase();

    if (!subscribedSymbols.has(upperSymbol)) {
      return; // Not subscribed
    }

    const newSubscribed = new Set(subscribedSymbols);
    newSubscribed.delete(upperSymbol);
    set({ subscribedSymbols: newSubscribed });

    if (ws && isConnected) {
      const msg: WsClientMessage = { type: "unsubscribe", symbol: upperSymbol };
      ws.send(JSON.stringify(msg));
    }
  },

  subscribeMany: (symbols: string[]) => {
    symbols.forEach((symbol) => {
      get().subscribe(symbol);
    });
  },

  clearData: () => {
    set({
      prices: {},
      prevPrices: {},
      timeSeries: {},
      subscribedSymbols: new Set(),
    });
  },
}));
