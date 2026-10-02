import type { SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Notifications } from '@/lib/notifications';
import { Platform } from 'react-native';
import { requestNotificationPermission } from '@/features/reminders/notifications';

/** Daftarkan token push (opsional) untuk pengingat/doa dari anggota grup. Isi push tidak pernah memuat data privat. */
export async function registerPush(sb: SupabaseClient): Promise<void> {
  if (!(await requestNotificationPermission())) throw new Error('Izin notifikasi diperlukan.');
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId) throw new Error('Push belum dikonfigurasi (EAS projectId kosong).');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await sb.from('push_tokens').upsert({ token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
  if (error) throw new Error(error.message);
}

export async function unregisterPush(sb: SupabaseClient, uid: string): Promise<void> {
  const { error } = await sb.from('push_tokens').delete().eq('user_id', uid);
  if (error) throw new Error(error.message);
}
