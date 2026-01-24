import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      await login();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6 bg-black">
      <Text className="text-white text-3xl font-bold mb-2">Stock Watch</Text>
      <Text className="text-zinc-400 text-center mb-8">
        Sign in to track stocks in real-time and create price alerts.
      </Text>

      <Pressable
        onPress={onLogin}
        disabled={loading}
        className="w-full rounded-2xl bg-white py-4 items-center"
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-black font-semibold text-base">Continue with Auth0</Text>
        )}
      </Pressable>
    </View>
  );
}
