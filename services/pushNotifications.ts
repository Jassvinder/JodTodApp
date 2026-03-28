import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Lazy load - expo-notifications crashes in Expo Go SDK 53+
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  // Not available in Expo Go
}

/**
 * Setup notification handler (call early in app lifecycle).
 * Safe to call in Expo Go - will silently skip if not available.
 */
export function setupNotificationHandler(): void {
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // Silently fail in Expo Go
  }
}

/**
 * Register for push notifications and send token to backend.
 * Returns null in Expo Go or when permissions denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device) {
    console.log('Push notifications not available (Expo Go or missing package)');
    return null;
  }

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Send token to backend
    await sendTokenToBackend(token);

    // Android: create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.log('Push notification setup failed (expected in Expo Go):', error);
    return null;
  }
}

/**
 * Send device token to backend API.
 */
async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await api.post('/device-token', {
      token,
      platform: 'expo',
    });
  } catch (error) {
    console.log('Failed to register device token:', error);
  }
}

/**
 * Remove device token from backend (call on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  if (!Notifications) return;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await api.delete('/device-token', {
      data: { token: tokenData.data },
    });
  } catch {
    // Silent fail - token cleanup is best effort
  }
}

/**
 * Add listener for notification tap responses.
 * Returns cleanup function. Safe in Expo Go.
 */
export function addNotificationResponseListener(
  callback: (data: Record<string, any>) => void
): () => void {
  if (!Notifications) return () => {};

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data) callback(data);
    });

    return () => Notifications!.removeNotificationSubscription(subscription);
  } catch {
    return () => {};
  }
}
