import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from './api';

const PUSH_TOKEN_KEY = '@sindi_push_token';
const DEVICE_ID_KEY = '@sindi_device_id';
const LOCATION_KEY = '@sindi_user_location';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save the token.
 * Returns the Expo push token string or null if registration fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for push notifications');
    return null;
  }

  try {
    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    const token = tokenData.data;
    console.log('[Push] Token:', token);

    // Save token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Send token to backend
    await syncPushTokenToBackend(token);

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('outage-alerts', {
        name: 'Outage Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD600',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.warn('[Push] Registration failed:', error);
    return null;
  }
}

/**
 * Sync the push token to the backend along with saved location.
 */
async function syncPushTokenToBackend(token: string) {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    // Get saved location
    const savedLocation = await AsyncStorage.getItem(LOCATION_KEY);
    let city: string | undefined;
    let barangay: string | undefined;
    let emergencyOnly = false;

    if (savedLocation) {
      const parsed = JSON.parse(savedLocation);
      city = parsed.city;
      barangay = parsed.barangay;
      emergencyOnly = parsed.emergency_only || false;
    }

    // Register/update user with push token
    const BASE_URL = 'https://sindi-production.up.railway.app';
    await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        city,
        barangay,
        emergency_only: emergencyOnly,
        push_token: token,
      }),
    });

    console.log('[Push] Token synced to backend');
  } catch (err) {
    console.warn('[Push] Failed to sync token:', err);
  }
}

/**
 * Add a listener for received notifications (foreground).
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification responses (user tapped notification).
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
