import "./global.css"
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeProvider } from '@/contexts/theme.context';
import { initializeNotifications } from '@/shared/notifications';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

