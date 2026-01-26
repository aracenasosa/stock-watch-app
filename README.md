# Stock Watch App

A real-time stock tracking application built with React Native (Expo) and NestJS. This application allows users to watch stock prices in real-time, view historical data on interactive charts, and set price alerts.

## 🚀 Features

- **Real-time Market Data**: Live stock prices via Finnhub WebSockets.
- **Interactive Graphs**: High-performance charts using Victory Native XL and Skia.
- **Price Alerts**: Server-side price monitoring and push notifications.
- **Watchlist**: Personalized list of tracked stocks with daily fluctuation indicators.
- **Authentication**: Secure login via Auth0 and JWT.

## 🏗 Architecture

The project follows a modern client-server architecture:

- **Frontend**: React Native with Expo (Managed Workflow).
  - State Management: `zustand`
  - Navigation: `expo-router`
  - UI/Styling: `nativewind` (Tailwind CSS)
  - Charts: `victory-native` + `react-native-skia`
- **Backend**: NestJS (Node.js).
  - Database: SQLite with `Prisma ORM`
  - Real-time: `WebSocketGateway` for broadcasting price updates.
  - External API: Finnhub.io for market data.

## 🛠 Tech Stack & Dependencies

### Frontend

- **React Native** / **Expo SDK 52**
- **TypeScript**
- **NativeWind** (Styling)
- **Victory Native XL** (Charts)
- **React Native Auth0** (Authentication)
- **Zustand** (Global State)

### Backend

- **NestJS**
- **Prisma** (ORM)
- **SQLite**
- **Firebase Admin** (FCM Notifications)
- **Passport JWT** (Auth Guard)

## ⚡ Setup & Installation

For the backend you can read the docs in backend/README.md file for more details.
For the frontend you can read the docs in frontend/README.md file for more details.
