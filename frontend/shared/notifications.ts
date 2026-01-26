import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "@/shared/api";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions from the user
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn(
      "[Notifications] Push notifications require a physical device",
    );
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] Permission not granted");
    return false;
  }

  return true;
}

// Get the Expo Push Token for this device
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // For Android, we need to set up a notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0A84FF",
      });
    }

    // For Android, we MUST get the raw device token (FCM) because the backend uses firebase-admin directly.
    if (Platform.OS === "android") {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      return deviceToken.data;
    }

    // Get the Expo push token (standard for iOS/Expo service)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID!,
    });

    return tokenData.data;
  } catch (error) {
    console.error("[Notifications] Failed to get push token:", error);
    return null;
  }
}

// Register the device token with the backend
export async function registerDeviceToken(token: string): Promise<boolean> {
  try {
    const platform = Platform.OS === "ios" ? "ios" : "android";

    await api.post("/devices/register", {
      token,
      platform,
    });

    return true;
  } catch (error: any) {
    console.error(
      "[Notifications] Failed to register device token:",
      error.response?.data || error.message,
    );
    return false;
  }
}

// Unregister the device token from the backend (call on logout)
export async function unregisterDeviceToken(token: string): Promise<boolean> {
  try {
    await api.delete("/devices/unregister", {
      data: { token },
    });

    return true;
  } catch (error: any) {
    console.error(
      "[Notifications] Failed to unregister device token:",
      error.response?.data || error.message,
    );
    return false;
  }
}

// Initialize notifications - request permissions and register token
export async function initializeNotifications(): Promise<string | null> {
  try {
    const token = await getExpoPushToken();

    if (token) {
      const success = await registerDeviceToken(token);
      if (!success) {
        console.warn(
          "[Notifications] Initial registration failed, will retry on next app load.",
        );
      }
    }

    return token;
  } catch (error) {
    console.error("[Notifications] Critical error during init:", error);
    return null;
  }
}

// Add a listener for notification responses (when user taps on notification)
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Add a listener for notifications received while app is in foreground
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}
