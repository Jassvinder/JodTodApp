import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const { isAuthenticated, isLoading, user, loadToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onVerifyScreen = (segments as string[]).includes('verify-email');

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !user?.email_verified_at && !onVerifyScreen) {
      router.replace('/(auth)/verify-email');
    } else if (isAuthenticated && user?.email_verified_at && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, user, segments]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Slot />
    </SafeAreaProvider>
  );
}
