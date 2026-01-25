/**
 * Stock symbols available for alert creation dropdown
 */
export const DROPDOWN_SYMBOLS = [
  "AAPL", // Apple
  "MSFT", // Microsoft
  "GOOGL", // Alphabet
  "AMZN", // Amazon
  "META", // Meta
  "TSLA", // Tesla
  "NVDA", // Nvidia
  "NFLX", // Netflix
  "AMD", // AMD
  "INTC", // Intel
  "ORCL", // Oracle
  "IBM", // IBM
  "ADBE", // Adobe
  "CRM", // Salesforce
  "UBER", // Uber
  "PYPL", // PayPal
  "SHOP", // Shopify
  "SPOT", // Spotify
  "SQ", // Block (Square)
  "COIN", // Coinbase
] as const;

/**
 * Default symbols to show on watchlist and chart on app start
 */
export const DEFAULT_WATCHLIST_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "NVDA",
  "NFLX",
  "AMD",
  "INTC",
] as const;

export type StockSymbol = (typeof DROPDOWN_SYMBOLS)[number];
