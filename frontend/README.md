# Stock Watch App (Frontend)

A real-time stock tracking mobile application built with React Native (Expo). This application allows users to watch stock prices in real-time, view historical data on interactive charts, and set price alerts.

## 🚀 Features

- **Real-time Market Data**: Live stock prices via WebSockets.
- **Interactive Graphs**: High-performance charts using Victory Native XL and Skia.
- **Price Alerts**: Interface for managing price monitoring.
- **Watchlist**: Personalized list of tracked stocks with daily fluctuation indicators.
- **Authentication**: Secure login via Auth0.

## 🏗 Architecture

The frontend is built using **React Native** with the **Expo Managed Workflow**.

- **Navigation**: File-based routing using `expo-router`.
- **State Management**: `zustand` for simple, scalable global state (Auth, Market Data, Alerts).
- **Styling**: `nativewind` (Tailwind CSS) for utility-first styling.
- **Graphics**: `react-native-skia` for high-performance 2D graphics.
- **Charts**: `victory-native` for interactive financial data visualization.

## 🛠 Tech Stack & Dependencies

- **React Native** / **Expo SDK 52**
- **TypeScript**
- **NativeWind** (Styling)
- **Victory Native XL** (Charts)
- **React Native Auth0** (Authentication)
- **Zustand** (Global State)
- **Axios** (API Requests)

## ⚡ Setup & Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npx expo start
   ```

3. **Run on Android**:
   ```bash
   npx expo run:android
   ```
   _Note: Ensure you have an Android emulator running or a device connected._

---

## Android build setup (Expo + React Native + NDK)

I have a couple of problems in the prebuild process with android emulator because this project uses native Android modules (Expo modules / RN new architecture). If Android is not configured correctly, builds may fail with NDK/C++ linker errors or Auth0 redirect issues.

### 1) Install Android SDK + Tools

1. Install **Android Studio**.
2. Open **SDK Manager** → **SDK Tools**.
3. Install:
   - **Android SDK Platform-Tools**
   - **Android SDK Build-Tools**
   - **Android SDK Command-line Tools (latest)**
   - **CMake** (the version Android Studio recommends)

---

### 2) SDK path must not contain spaces

The **Android SDK directory should not include whitespace** (spaces) in its path, because it can break NDK tooling.

---

### 3) Install the required NDK version

This project expects:

- **NDK (Side by side): `27.0.12077973`**

Steps:

1. Android Studio → **SDK Manager** → **SDK Tools**
2. Check **“Show Package Details”**
3. Under **NDK (Side by side)** install **`27.0.12077973`**

---

### 4) Create `android/local.properties`

Make sure this file exists:

**`android/local.properties`**

```properties
sdk.dir=<ABSOLUTE_PATH_TO_YOUR_ANDROID_SDK>
```

---

### 5) Force the NDK version in Gradle

Add this to **`android/build.gradle`**:

```buildscript {
  ext {
    ndkVersion = "27.0.12077973"
  }
}
```

Add this to **`android/app/build.gradle`**:

```android
  ndkVersion rootProject.ext.ndkVersion
```

### 6) Set Scheme in expo and Manifest

Add this to **`app.json`**:

```json
"expo": {
    "scheme": "<YOUR_SCHEME>",
    "android": {
      "package": "<YOUR_ANDROID_PACKAGE>"
    }
}
```

Add this to **In `android/app/build.gradle` inside defaultConfig**:

```gradle
defaultConfig {
  applicationId "<YOUR_ANDROID_PACKAGE>"

  manifestPlaceholders = [
    auth0Domain: "<YOUR_AUTH0_DOMAIN>",
    auth0Scheme: "<YOUR_SCHEME_OR_PACKAGE_SCHEME>"
  ]
}
```

### 7) Auth0 Dashboard: Allowed Callback + Logout URLs

**In Auth0 Dashboard → Applications → Your App → Settings**:

```
Allowed Callback URLs:
<YOUR_SCHEME>://<YOUR_AUTH0_DOMAIN>/android/<YOUR_ANDROID_PACKAGE>/callback

Allowed Logout URLs:
<YOUR_SCHEME>://<YOUR_AUTH0_DOMAIN>/android/<YOUR_ANDROID_PACKAGE>/callback
```
