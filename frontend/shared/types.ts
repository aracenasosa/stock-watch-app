// Shared type definitions for the Stock Watch app

export interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  isTriggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface User {
  id: string;
  sub: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  prevPrice: number;
  timestamp: number;
}

export interface TimeSeriesPoint {
  x: number; // timestamp
  y: number; // price
}

// WebSocket message types from backend
export type WsMessage =
  | { type: "subscribed"; symbol: string }
  | { type: "unsubscribed"; symbol: string }
  | { type: "tick"; symbol: string; price: number; ts: number }
  | { type: "quote"; symbol: string; price: number; ts: number; source: "poll" }
  | { type: "error"; message: string };

export type WsClientMessage =
  | { type: "subscribe"; symbol: string }
  | { type: "unsubscribe"; symbol: string };
