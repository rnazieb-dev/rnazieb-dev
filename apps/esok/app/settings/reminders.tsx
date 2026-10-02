import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { Button, Card, Chip, Field, Row, Screen, Text, Toggle } from '@/components/ui';
import { notificationPermission, requestNotificationPermission } from '@/features/reminders/notifications';
import type { Intensity } from '@/features/reminders/schedule';
import { useApp } from '@/state/app';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function RemindersSettings() {
  const { settings, updateSettings, reschedule } = useApp();
  const r = settings.reminders;
  const [perm, setPerm] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [time, setTime] = useState('');

  useEffect(() => {
    void notificationPermission().then(setPerm);
  }, []);

  const set = (patch: Partial<typeof r>) => updateSettings({ reminders: { ...r, ...patch } });

  const usePrayer = async (on: boolean) => {
    if (!on) return updateSettings({ prayerMode: 'tetap' });
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) return Alert.alert('Izin lokasi', 'Lokasi diperlukan untuk menghitung waktu salat. Data tidak dikirim ke server.');
    const pos = await Location.getLastKnownPositionAsync() ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    // Dibulatkan 2 desimal (~1 km): cukup untuk waktu salat, lebih privat.
    const coords = { latitude: Math.round(pos.coords.latitude * 100) / 100, longitude: Math.round(pos.coords.longitude * 100) / 100 };
    await updateSettings({ prayerMode: 'salat', coords });
  };

  return (
    <Screen>
      <Toggle label="Pengingat harian" value={r.enabled} onValueChange={(v) => set({ enabled: v })} hint="Notifikasi lokal; tidak butuh internet." />
      {perm !== 'granted' && r.enabled ? (
        <Card tone="accent">
          <Text>Izin notifikasi belum diberikan.</Text>
          <Button title={perm === 'denied' ? 'Buka pengaturan sistem' : 'Izinkan notifikasi'} onPress={async () => { if (perm === 'denied') await Linking.openSettings(); else { await requestNotificationPermission(); setPerm(await notificationPermission()); await reschedule(); } }} />
        </Card>
      ) : null}

      <Text variant="label">Seberapa sering?</Text>
      <Row>
        {(['ringan', 'sedang', 'sering'] as Intensity[]).map((i) => (
          <Chip key={i} label={i === 'ringan' ? '1×/hari' : i === 'sedang' ? '2×/hari' : '3×/hari'} selected={r.intensity === i} onPress={() => set({ intensity: i })} />
        ))}
      </Row>
      <Toggle label="Sertakan nada peringatan" value={r.allowKhauf} onValueChange={(v) => set({ allowKhauf: v })} hint="Nada peringatan tidak pernah berturut-turut dan selalu diimbangi harapan & ajakan beramal." />

      <Toggle label="Pengingat dzikir pagi & petang" value={settings.adhkarReminder} onValueChange={(v) => updateSettings({ adhkarReminder: v })} hint="Dua pengingat per hari (30 menit setelah Subuh/Asar bila memakai waktu salat). Tanpa hitungan poin." />
      <Toggle label="Pengingat jatuh tempo catatan" value={settings.dueReminders} onValueChange={(v) => updateSettings({ dueReminders: v })} hint="Teks generik tanpa nama atau nominal, agar aman di layar kunci." />
      <Toggle label="Ikuti waktu salat" value={settings.prayerMode === 'salat'} onValueChange={usePrayer} hint="Pengingat 20 menit setelah Subuh, 15 menit setelah Asar & Isya (perkiraan Kemenag; bukan acuan ibadah)." />
      {settings.prayerMode === 'tetap' ? (
        <Card>
          <Text variant="label">Jam pengingat</Text>
          <Row>
            {r.times.map((t) => <Chip key={t} label={`${t} ✕`} onPress={() => set({ times: r.times.filter((x) => x !== t) })} />)}
          </Row>
          <Row>
            <Field label="Tambah jam (HH:MM)" value={time} onChangeText={setTime} placeholder="05:00" maxLength={5} keyboardType="numbers-and-punctuation" />
            <Button title="Tambah" variant="secondary" disabled={!TIME_RE.test(time) || r.times.includes(time) || r.times.length >= 6} onPress={() => { set({ times: [...r.times, time].sort() }); setTime(''); }} />
          </Row>
        </Card>
      ) : null}

      <Button
        title="Uji notifikasi (5 detik)"
        variant="secondary"
        onPress={async () => {
          if (!(await requestNotificationPermission())) return Alert.alert('Izin notifikasi diperlukan');
          await Notifications.scheduleNotificationAsync({ content: { title: 'Esok — uji', body: 'Pengingat berfungsi. Semoga hari ini penuh kebaikan.' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } });
        }}
      />
      <Text variant="small" muted>iOS membatasi 64 notifikasi terjadwal; Esok menjadwalkan jendela 10 hari dan memperbarui setiap kali aplikasi dibuka.</Text>
    </Screen>
  );
}
