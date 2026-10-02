import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/** Expo Go (Android) tidak lagi memuat expo-notifications sejak SDK 53; pakai stub agar aplikasi tetap bisa dipratinjau. */
export const notificationsSupported = !(
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

const denied = { status: 'denied', granted: false, canAskAgain: false, expires: 'never' };
const noop = async (): Promise<void> => undefined;

const stub = {
  setNotificationHandler: () => undefined,
  setNotificationChannelAsync: noop,
  getPermissionsAsync: async () => denied,
  requestPermissionsAsync: async () => denied,
  cancelAllScheduledNotificationsAsync: noop,
  scheduleNotificationAsync: async () => '',
  addNotificationResponseReceivedListener: () => ({ remove: () => undefined }),
  getExpoPushTokenAsync: async () => {
    throw new Error('Notifikasi tidak tersedia di Expo Go');
  },
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
} as unknown as NotificationsModule;

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const Notifications: NotificationsModule = notificationsSupported ? require('expo-notifications') : stub;
