Stock Watch API

A backend service that provides real-time stock price updates, price alerts, and push notifications, built with NestJS, Prisma, Auth0, Finnhub, and Firebase Cloud Messaging (FCM).

The system uses a hybrid real-time strategy: WebSocket streaming when available, with a REST polling fallback to ensure reliability.

# Setup

## Environment Variables

Create a .env file:

# App

PORT=3000
NODE_ENV=development

# Database

DATABASE_URL="file:./data/dev.db"

# Auth0

AUTH0_DOMAIN=your-test.auth0.com
AUTH0_AUDIENCE=https://yourprojectname-api
AUTH0_ISSUER_URL=https://your-test.auth0.com/
AUTH0_JWKS_URI=https://your-test.auth0.com/.well-known/jwks.json

# Finnhub

FINNHUB_API_KEY=your_finnhub_api_key
FINNHUB_BASE_URL=https://finnhub.io/api/v1
FINNHUB_WS_URL=wss://ws.finnhub.io

# Quote fallback

QUOTE_FALLBACK_ENABLED=true
QUOTE_FALLBACK_MS=10000
QUOTE_SKIP_IF_TICK_ENABLED=true
QUOTE_SKIP_IF_TICK_WITHIN_MS=15000

# Firebase Cloud Messaging

FCM_PROJECT_ID=your_project_id
FCM_CLIENT_EMAIL=your_service_account_email
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

Running the Project (Prisma Setup)
pnpm install or npm install
pnpm prisma migrate dev or npm run prisma migrate dev
pnpx prisma generate or npx prisma generate
pnpm start:dev or npm run start:dev

Swagger documentation will be available at:

http://localhost:3000/docs

API Overview
Users

GET /users/ME – get current user or create if not exists

GET /users – list users

Alerts

POST /alerts – create alert

GET /alerts – list user alerts

PATCH /alerts/:id – update alert

DELETE /alerts/:id – delete alert

Devices (FCM)

POST /devices/register

DELETE /devices/unregister

GET /devices

WebSocket (Market Data)

Connect to:

ws://localhost:3000/ws?token=JWT

Client messages:

{ "type": "subscribe", "symbol": "AAPL" }
{ "type": "unsubscribe", "symbol": "AAPL" }

Server messages:

{ "type": "tick", "symbol": "AAPL", "price": 189.12, "ts": 1700000000000 }
{ "type": "quote", "symbol": "AAPL", "price": 189.05, "source": "poll" }
{ "type": "error", "message": "Invalid message format" }

Docker & Containerization

The project supports Docker-based execution to ensure a consistent runtime environment and simplify setup.

Docker Setup (Backend)

A basic Dockerfile and docker-compose.yml are provided to run the API in a containerized environment.

Build and run with Docker Compose
docker compose up --build

The API will be available at:

http://localhost:3000

Swagger documentation:

http://localhost:3000/docs

Design Notes

Hybrid streaming (WebSocket) + polling ensures reliability without overloading the API.

Fallback polling is configurable and can be disabled.

Alert evaluation runs on both live trades and fallback quotes.

Focused on correctness, clarity, and real-world behavior.

Full backend containerization with docker-compose.yml

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

## Finnhub WebSocket messages

This project connects to the Finnhub WebSocket API to receive real-time market data.
During development, basic logs are used to verify connection status and message flow.

---

### Finnhub WebSocket message types

#### `ping`

```json
{ "type": "ping" }
```

- Sent periodically by Finnhub
- Confirms the WebSocket connection is alive
- No action required

Logged as:

```
[FINNHUB] msg {"type":"ping"}
```

#### `trade`

```json
{ "type": "trade" }
```

s: symbol
p: price
t: timestamp (ms)
v: volume

Used to:

- Update live prices
- Trigger alert evaluation
- Feed charts or real-time UI

Logged as:

```
[FINNHUB] msg {"type":"trade"}
```

```json
{
  "type": "trade",
  "data": [
    {
      "s": "AAPL", // Symbol
      "p": 189.42, // Price
      "t": 1706112345678, // Timestamp
      "v": 120 // Volume
    }
  ]
}
```

# Extra information:

Key Features

- Real-time Market Updates

- Streams live trades from Finnhub WebSocket.

- Supports subscribe / unsubscribe per symbol over WebSocket.

- Automatically reconnects and re-subscribes on WS disconnects.

- Quote Fallback (Reliability)

- Finnhub WebSocket can be idle (pings only, no trades).

- A configurable polling fallback fetches real-time quotes at a fixed interval.

Ensures:

- UI keeps updating

- Alerts still trigger

- App doesn’t appear frozen

This fallback can be enabled/disabled via environment variables.

Price Alerts

- Users can create alerts for a symbol and target price.

- Alerts trigger when price reaches or exceeds the target.

- Triggered alerts cannot be updated.

- Duplicate active alerts (same symbol + price) are prevented.

Push Notifications (FCM)

- Mobile devices can be registered per user.

- When an alert triggers, notifications are sent to all user devices.

- Invalid FCM tokens are automatically cleaned up.

Authentication

- Uses Auth0 JWTs for HTTP and WebSocket authentication.

- Global JWT guard with support for public routes.

# Project Structure (simplified)

src/
├── alerts/ # Alert CRUD + evaluation
├── auth/ # JWT strategies & guards
├── devices/ # Device token registration (FCM)
├── finnhub/ # WebSocket gateway + fallback logic
├── market/ # Finnhub REST API access
├── notifications/ # Firebase Cloud Messaging
├── users/ # User provisioning (Auth0 sub)
├── prisma/ # Prisma service & schema
└── main.ts
