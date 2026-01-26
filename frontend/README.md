# 📱 Stock Watch (Frontend)

A high-performance real-time stock tracking mobile application built with **React Native** and **Expo SDK 52**. Leveraging **Skia** for fluid animations and **Victory Native XL** for professional financial data visualization.

---

## 🚀 Key Features

- **⚡ Real-time Market Data**: Instant price updates via WebSockets and REST fallback.
- **📊 Interactive Charts**: 60fps high-performance financial graphs powered by **Skia**.
- \*🔔 Price Alerts\*\*: Seamless interface for managing server-side monitoring.
- **📋 Custom Watchlist**: Personalized stock tracking with daily fluctuation indicators.
- **🔐 Secure Auth**: Industry-standard authentication via **Auth0**.

---

## 🛠 Tech Stack & Key Libraries

Beyond the core framework, this app leverages a premium stack for a superior user experience:

### **Data & Visuals**

| Library               | Purpose                              |
| :-------------------- | :----------------------------------- |
| **Victory Native XL** | Next-gen charting for React Native.  |
| **react-native-skia** | High-performance 2D graphics engine. |
| **Zustand**           | Scalable global state management.    |
| **Axios**             | Robust REST API communication.       |

### **UI & Logic**

| Library             | Purpose                                          |
| :------------------ | :----------------------------------------------- |
| **NativeWind**      | Utility-first styling (Tailwind CSS) for mobile. |
| **Expo Router**     | Type-safe, file-based navigation.                |
| **React Hook Form** | Efficient form state and validation logic.       |
| **Zod**             | Schema validation for data integrity.            |

---

## 🧪 Testing

The project is configured with a robust testing environment:

- **Jest** & **Jest Expo**: Primary testing frameworks.
- **React Native Testing Library**: For high-confidence component testing.

**Run the test suite:**

```bash
npm test
```

---

## ⚡ Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Expo Server

```bash
# General start
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
