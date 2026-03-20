import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contacts" options={{ headerShown: true, title: 'My Contacts', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="contacts-add" options={{ headerShown: true, title: 'Add Contact', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="todos" options={{ headerShown: true, title: 'My Tasks', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="todos-add" options={{ headerShown: true, title: 'Add Task', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="todos-edit" options={{ headerShown: true, title: 'Edit Task', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="todo-categories" options={{ headerShown: true, title: 'Task Categories', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-create" options={{ headerShown: true, title: 'Create Group', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-detail" options={{ headerShown: true, title: 'Group', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-edit" options={{ headerShown: true, title: 'Edit Group', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-join" options={{ headerShown: true, title: 'Join Group', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-add-member" options={{ headerShown: true, title: 'Add Member', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-expenses" options={{ headerShown: true, title: 'Group Expenses', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-expense-add" options={{ headerShown: true, title: 'Add Group Expense', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-expense-edit" options={{ headerShown: true, title: 'Edit Group Expense', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="groups-settlements" options={{ headerShown: true, title: 'Settlements', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications', headerStyle: { backgroundColor: Colors.surface }, headerTitleStyle: { fontWeight: '600', color: Colors.text }, headerShadowVisible: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
