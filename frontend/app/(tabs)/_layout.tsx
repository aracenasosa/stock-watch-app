import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/theme.context";
import { useAuthStore } from "@/stores/auth.store";
import { useMarketStore } from "@/stores/market.store";
import { useEffect } from "react";
import { initializeNotifications } from "@/shared/notifications";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { tokens, isHydrated } = useAuthStore();
  const { connect, disconnect, isConnected } = useMarketStore();
  const router = useRouter();

  // 1. Auth Guard: Redirect to login if not authenticated
  useEffect(() => {
    if (isHydrated && !tokens) {
      router.replace('/(auth)/login');
    }
  }, [isHydrated, tokens]);

  // 2. Persistent WebSocket connection and Notifications for the main app
  useEffect(() => {
    if (tokens?.accessToken) {
      connect(tokens.accessToken);
      initializeNotifications();
    }
    return () => {
      disconnect();
    };
  }, [tokens?.accessToken]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          height: 80,
          paddingTop: 8,
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { 
          fontSize: 10, 
          marginBottom: 8,
          fontWeight: '500'
        },
      }}
    >
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="graph"
        options={{
          title: "Graph",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-alert"
        options={{
          title: "Add Alert",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
