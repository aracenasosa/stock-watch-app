import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";

export default function Callback() {
  const router = useRouter();
  const { error } = useLocalSearchParams<{ error?: string }>();
  const tokens = useAuthStore((s) => s.tokens);

  useEffect(() => {
    // If Auth0 sent an error, send the user back to login
    if (error) {
      router.replace("/(auth)/login");
      return;
    }

    // If we have tokens, user is authenticated – send to main tabs
    if (tokens?.accessToken) {
      router.replace("/(tabs)/watchlist");
      return;
    }

    // Fallback: if nothing happens after a short delay, go back to login
    const timeout = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [error, tokens?.accessToken, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}