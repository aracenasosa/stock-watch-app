# ⚙️ Stock Watch API (Backend)

The engine behind the Stock Watch ecosystem. A high-performance NestJS service providing real-time data streaming, intelligent alert monitoring, and persistent notification delivery.

---

## 🏗 Key Features

- **⚡ Hybrid Data Strategy**: Seamless switching between WebSocket streams and REST polling fallback.
- **🔔 Global Monitoring**: Background symbol watching ensures alerts trigger even without active clients.
- **🔐 Robust Auth**: Type-safe Auth0 integration with JWT guards for WebSocket and REST endpoints.
- **🛰 Notification Delivery**: Scalable Firebase Cloud Messaging (FCM) integration with automatic token cleanup.

---

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: [Prisma](https://www.prisma.io/) + [SQLite](https://www.sqlite.org/)
- **Real-time**: [ws](https://github.com/websockets/ws) (WebSocket)
- **Auth**: [Auth0](https://auth0.com/)
- **Messaging**: [Firebase Admin SDK](https://firebase.google.com/docs/admin)

---

## 🚀 Setup & Installation

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="file:./data/dev.db"

# Auth0
AUTH0_DOMAIN=your-test.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier

# Finnhub
FINNHUB_API_KEY=your_key
FINNHUB_WS_URL=wss://ws.finnhub.io

# Firebase (FCM)
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=your-service-account-email
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 2. Run Locally

```bash
# Install dependencies
pnpm install

# Setup Database
pnpm prisma migrate dev
pnpx prisma generate

# Start in development mode
pnpm start:dev
```

### 3. Run with Docker

```bash
docker compose up --build
```

---

## 📡 API Overview

### **Auth & Users**

- `GET /users/ME`: Onboard or retrieve current user profile.
- `GET /users`: List (admin/internal) users.

### **Alert Management**

- `POST /alerts`: Create a new price target alert.
- `GET /alerts`: List all user-specific alerts.
- `PATCH /alerts/:id`: Update target price or symbol.
- `DELETE /alerts/:id`: Remove an alert.

### **FCM Notifications**

- `POST /devices/register`: Link a device token to the user.
- `DELETE /devices/unregister`: Remove a device token.

---

## 🔌 WebSocket API

**Path**: `ws://localhost:3000/ws?token=JWT`

### **Supported Messages**

- `subscribe`: `{ "type": "subscribe", "symbol": "AAPL" }`
- `unsubscribe`: `{ "type": "unsubscribe", "symbol": "AAPL" }`

### **Server Broadcast**

- `tick`: Live market trade data.
- `quote`: Real-time quote from fallback polling.

---

<p align="center">
  Built for reliability and sub-second performance.
</p>
