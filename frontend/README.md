# 📱 Stock Watch (Frontend)

A high-performance real-time stock tracking mobile application built with **React Native** and **Expo SDK 54**. Leveraging **React 19** and **Skia** for fluid animations and **Victory Native (v41+)** for professional financial data visualization.

---

## 🚀 Key Features

- **⚡ Real-time Market Data**: Instant price updates via WebSockets with optimized state synchronization.
- **📊 Interactive Charts**: 60fps high-performance financial graphs powered by **Victory Native** and **Skia**.
- **🔔 Price Alerts**: Seamless interface for managing server-side monitoring and push notifications.
- **📋 Custom Watchlist**: Personalized stock tracking with live daily fluctuation indicators.
- **🔐 Secure Auth**: Industry-standard authentication via **react-native-auth0**.

---

## 🛠 Tech Stack & Key Libraries

This app leverages a premium, modern stack for a superior user experience:

### **Data & Visuals**

| Library            | Purpose                                               |
| :----------------- | :---------------------------------------------------- |
| **Victory Native** | Modern, Skia-powered charting library (v41+).         |
| **Shopify Skia**   | High-performance 2D graphics engine for React Native. |
| **Zustand**        | Lightweight and scalable global state management.     |
| **Axios**          | Robust REST API communication.                        |
| **TanStack Query** | Asynchronous state management and data fetching.      |

### **UI & Logic**

| Library             | Purpose                                                      |
| :------------------ | :----------------------------------------------------------- |
| **NativeWind (v4)** | Utility-first styling (Tailwind CSS) with Native support.    |
| **Expo Router**     | Type-safe, file-based navigation system.                     |
| **Auth0**           | Enterprise-grade identity management (`react-native-auth0`). |
| **Reanimated**      | Powerful animations and gesture handling.                    |
| **React Hook Form** | Efficient form state and validation logic.                   |

---

## 📂 Project Structure

```text
frontend/
├── app/               # Expo Router file-based navigation
│   ├── (auth)/        # Authentication flows (Login)
│   ├── (tabs)/        # Main app tabs (Watchlist, Graph, Settings)
│   └── _layout.tsx    # Root navigation layout
├── components/        # Reusable UI components
├── contexts/          # React Context providers (Theme, Auth)
├── shared/            # Shared utilities, constants, and types
│   ├── api.ts         # Centralized Axios instance
│   └── auth0.ts       # Auth0 configuration
├── stores/            # Zustand store definitions (Market, Alerts, Auth)
└── assets/            # Static images and fonts
```

---

## ⚡ Setup & Installation

### 1. Environment Configuration

Create a `.env` file in the `frontend` root:

```env
EXPO_PUBLIC_API_URL=http://your-server-ip:3000
EXPO_PUBLIC_WS_URL=ws://your-server-ip:3000
EXPO_PUBLIC_AUTH0_DOMAIN=your-auth0-domain
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
EXPO_PUBLIC_AUTH0_AUDIENCE=your-api-audience
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Start Expo Server

```bash
# General start (Development Client)
npx expo start

# Run specifically on Android
npx expo run:android
```

---

## 🤖 Android Native Build Setup (NDK/C++)

> [!IMPORTANT]
> This project uses native Android modules. Failure to configure the NDK correctly will result in build errors or Auth0 redirect failures.

### 1. Prerequisites (Android Studio)

1. Open **SDK Manager** → **SDK Tools**.
2. Install:
   - **Android SDK Platform-Tools**
   - **Android SDK Build-Tools**
   - **Android SDK Command-line Tools (latest)**
   - **CMake** (latest recommended)

### 2. Install Required NDK

This project specifically requires **NDK Version: `27.0.12077973`**.

- In SDK Manager → SDK Tools, check **"Show Package Details"**.
- Install exactly **`27.0.12077973`**.

### 3. Local Properties

Create `frontend/android/local.properties` (replace path):

```properties
sdk.dir=C:\\Users\\<USER>\\AppData\\Local\\Android\\Sdk
```

### 4. Sync Configuration

Once the file is set up, run:

```bash
npx expo prebuild
```

---

<p align="center">
  🚀 Ready to track the market?
</p>
