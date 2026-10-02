import * as Location from 'expo-location';
import { Notifications } from '@/lib/notifications';
import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { Button, Card, Chip, Field, Row, Screen, Text, Toggle } from '@/components/ui';
import { notificationPermission, requestNotificationPermission } from '@/features/reminders/notifications';
import type { Intensity } from '@/features/reminders/schedule';
import { useApp } from '@/state/app';
import { useT } from '@/i18n/useT';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function RemindersSettings() {
  const { settings, updateSettings, reschedule } = useApp();
  const r = settings.reminders;
  const { t } = useT();
  const [perm, setPerm] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [time, setTime] = useState('');

  useEffect(() => {
    void notificationPermission().then(setPerm);
  }, []);

  const set = (patch: Partial<typeof r>) => updateSettings({ reminders: { ...r, ...patch } });

  const usePrayer = async (on: boolean) => {
    if (!on) return updateSettings({ prayerMode: 'tetap' });
    const p = await Location.requestForegroundPermissionsAsync();
    if (!p.granted) return Alert.alert(t('prefs.reminders.locationTitle'), t('prefs.reminders.locationBody'));
    const pos = await Location.getLastKnownPositionAsync() ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    // Dibulatkan 2 desimal (~1 km): cukup untuk waktu salat, lebih privat.
    const coords = { latitude: Math.round(pos.coords.latitude * 100) / 100, longitude: Math.round(pos.coords.longitude * 100) / 100 };
    await updateSettings({ prayerMode: 'salat', coords });
  };

  return (
    <Screen>
      <Toggle label={t('prefs.reminders.daily')} value={r.enabled} onValueChange={(v) => set({ enabled: v })} hint={t('prefs.shared.localNotifHint')} />
      {perm !== 'granted' && r.enabled ? (
        <Card tone="accent">
          <Text>{t('prefs.reminders.permMissing')}</Text>
          <Button title={perm === 'denied' ? t('prefs.reminders.openSystemSettings') : t('prefs.reminders.allowNotifications')} onPress={async () => { if (perm === 'denied') await Linking.openSettings(); else { await requestNotificationPermission(); setPerm(await notificationPermission()); await reschedule(); } }} />
        </Card>
      ) : null}

      <Text variant="label">{t('prefs.shared.howOften')}</Text>
      <Row>
        {(['ringan', 'sedang', 'sering'] as Intensity[]).map((i) => (
          <Chip key={i} label={t('prefs.shared.perDay', { n: i === 'ringan' ? 1 : i === 'sedang' ? 2 : 3 })} selected={r.intensity === i} onPress={() => set({ intensity: i })} />
        ))}
      </Row>
      <Toggle label={t('prefs.reminders.khauf')} value={r.allowKhauf} onValueChange={(v) => set({ allowKhauf: v })} hint={t('prefs.reminders.khaufHint')} />

      <Toggle label={t('prefs.reminders.adhkar')} value={settings.adhkarReminder} onValueChange={(v) => updateSettings({ adhkarReminder: v })} hint={t('prefs.reminders.adhkarHint')} />
      <Toggle label={t('prefs.reminders.due')} value={settings.dueReminders} onValueChange={(v) => updateSettings({ dueReminders: v })} hint={t('prefs.reminders.dueHint')} />
      <Toggle label={t('prefs.reminders.followPrayer')} value={settings.prayerMode === 'salat'} onValueChange={usePrayer} hint={t('prefs.reminders.followPrayerHint')} />
      {settings.prayerMode === 'tetap' ? (
        <Card>
          <Text variant="label">{t('prefs.reminders.timesTitle')}</Text>
          <Row>
            {r.times.map((tm) => <Chip key={tm} label={`${tm} ✕`} onPress={() => set({ times: r.times.filter((x) => x !== tm) })} />)}
          </Row>
          <Row>
            <Field label={t('prefs.reminders.addTime')} value={time} onChangeText={setTime} placeholder="05:00" maxLength={5} keyboardType="numbers-and-punctuation" />
            <Button title={t('prefs.reminders.add')} variant="secondary" disabled={!TIME_RE.test(time) || r.times.includes(time) || r.times.length >= 6} onPress={() => { set({ times: [...r.times, time].sort() }); setTime(''); }} />
          </Row>
        </Card>
      ) : null}

      <Button
        title={t('prefs.reminders.test')}
        variant="secondary"
        onPress={async () => {
          if (!(await requestNotificationPermission())) return Alert.alert(t('prefs.reminders.permRequired'));
          await Notifications.scheduleNotificationAsync({ content: { title: t('prefs.reminders.testTitle'), body: t('prefs.reminders.testBody') }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } });
        }}
      />
      <Text variant="small" muted>{t('prefs.reminders.iosNote')}</Text>
    </Screen>
  );
}
