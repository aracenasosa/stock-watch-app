import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const { isHydrated, tokens } = useAuthStore();

  if (!isHydrated) return null;

  return tokens?.accessToken ? (
    <Redirect href="/(tabs)/watchlist" />
  ) : (
    <Redirect href="/(auth)/login" />   
  );
}