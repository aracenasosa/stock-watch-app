## Finnhub Data Limitations

### Candle Data vs. Real-time Streams

Currently, the `/stock/candle` endpoint requires a higher-tier (paid) Finnhub plan. The API key provided for this project supports:

- **Real-time Quotes**
- **Real-time Trades (WebSocket)**

## UI Adaptations

Due to this limitation, the application does not render historical candle charts.
Instead, it **renders a real-time price visualization** built from live trades and quotes,
which still fulfills the requirement of displaying stock price movement.

![Finnhub API Plan Details](./readmeImages/stock_candle_paid.png)
![UI Real-time Visualization](./readmeImages/finnhub_doesnt_access.png)
