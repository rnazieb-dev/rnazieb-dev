import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { QUOTES } from '@/content';
import { type Coordinates, computePrayerTimes, formatHour } from './prayerTimes';
import { type ReminderSettings, buildSchedule, notificationBody } from './schedule';
import { recentQuoteIds } from '@/db/repos';
import type { Db } from '@/db/types';
import { type DayKey, fromDayKey, toDayKey } from '@/lib/dates';

const CHANNEL_ID = 'pengingat';

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pengingat harian',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0, 120],
  });
}

export async function notificationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export interface PrayerMode {
  mode: 'tetap' | 'salat';
  coords?: Coordinates;
}

/** Waktu pengingat berbasis salat: 20 mnt setelah Subuh, 15 mnt setelah Asar, 15 mnt setelah Isya. */
export function prayerBasedTimes(day: DayKey, coords: Coordinates): string[] {
  const d = fromDayKey(day);
  const tz = -d.getTimezoneOffset() / 60;
  const t = computePrayerTimes(d.getFullYear(), d.getMonth() + 1, d.getDate(), coords, tz);
  return [formatHour(t.subuh + 20 / 60), formatHour(t.asar + 15 / 60), formatHour(t.isya + 15 / 60)];
}

/** Batalkan semua jadwal lama lalu jadwalkan ulang jendela ke depan. Dipanggil saat app dibuka & pengaturan berubah. */
export async function rescheduleReminders(
  db: Db,
  settings: ReminderSettings,
  prayer: PrayerMode,
  seed: string,
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled) return 0;
  if (!(await notificationPermission().then((p) => p === 'granted'))) return 0;
  await ensureChannel();
  const now = new Date();
  const schedule = buildSchedule({
    now,
    today: toDayKey(now),
    settings,
    quotes: QUOTES,
    recentlySeen: await recentQuoteIds(db),
    seed,
    timesForDay: prayer.mode === 'salat' && prayer.coords ? (day) => prayerBasedTimes(day, prayer.coords as Coordinates) : undefined,
  });
  for (const r of schedule) {
    const q = QUOTES.find((x) => x.id === r.quoteId);
    if (!q) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Esok — pengingat',
        body: notificationBody(q),
        data: { quoteId: q.id },
        ...(Platform.OS === 'android' ? {} : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
  }
  return schedule.length;
}
