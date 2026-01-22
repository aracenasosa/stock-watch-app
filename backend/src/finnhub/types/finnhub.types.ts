export type FinnhubQuote = {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
  t: number; // unix time
};

export type FinnhubSymbol = {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
};

export type FinnhubCandles = {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  s: 'ok' | 'no_data';
  t: number[];
  v: number[];
};
