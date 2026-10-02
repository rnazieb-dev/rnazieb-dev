import { useRouter } from 'expo-router';
import { Bell, BellOff, MapPin } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeIn } from '@/components/motion';
import { Scene, phaseForHour } from '@/components/Scene';
import { Button, Card, Chip, Row, Text, Toggle } from '@/components/ui';
import { METHODS, type CalcMethod, resolveMethod } from '@/features/reminders/prayerTimes';
import { requestNotificationPermission } from '@/features/reminders/notifications';
import { type AlertKey, currentPrayer, nextPrayer, slotsFor, timesFor } from '@/features/salat/logic';
import { useSaveLocation } from '@/features/salat/useLocation';
import { countdownText, prayerName, useNow } from '@/features/salat/ui';
import { useT } from '@/i18n/useT';
import { radius, space, useTheme } from '@/lib/theme';
import { useApp } from '@/state/app';

export default function SalatScreen() {
  const th = useTheme();
  const router = useRouter();
  const { t } = useT();
  const { settings, updateSettings } = useApp();
  const { request, state } = useSaveLocation();
  const now = useNow(15000);
  const coords = settings.coords;
  const opts = { method: settings.calcMethod, hanafi: settings.asrHanafi };
  const [showMethod, setShowMethod] = useState(false);

  const data = useMemo(() => {
    if (!coords) return null;
    const slots = slotsFor(now, coords, opts);
    return { slots, next: nextPrayer(now, coords, opts), current: currentPrayer(now, coords, opts), times: timesFor(now, coords, opts) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, now, settings.calcMethod, settings.asrHanafi]);

  const hour = now.getHours() + now.getMinutes() / 60;
  const phase = phaseForHour(hour, data?.times);

  const toggleAlert = async (k: AlertKey) => {
    const on = !settings.prayerAlerts[k];
    if (on) await requestNotificationPermission();
    await updateSettings({ prayerAlerts: { ...settings.prayerAlerts, [k]: on } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl * 2 }}>
        <View>
          <Scene phase={phase} height={250} />
          <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, gap: 2 }}>
            {data ? (
              <>
                <RNText style={{ color: '#fff', fontSize: 34, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8 }}>
                  {prayerName(t, data.next.key, data.next.at)} · {data.next.hhmm}
                </RNText>
                <Row style={{ justifyContent: 'space-between' }}>
                  <RNText style={{ color: '#fff', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 }}>
                    {countdownText(t, data.next.at.getTime() - now.getTime())}
                  </RNText>
                  <Pressable onPress={request} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={16} color="#fff" />
                    <RNText style={{ color: '#fff', fontSize: 14 }}>{settings.placeName ?? t('salat.location')}</RNText>
                  </Pressable>
                </Row>
              </>
            ) : (
              <RNText style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{t('salat.title')}</RNText>
            )}
          </View>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.back')} style={{ position: 'absolute', top: 44, left: space.lg, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
            <RNText style={{ color: '#fff', fontWeight: '600' }}>‹ {t('common.back')}</RNText>
          </Pressable>
        </View>

        <View style={{ padding: space.lg, gap: space.md }}>
          {!data ? (
            <Card>
              <Text>{t('salat.noLocation')}</Text>
              <Button title={state === 'busy' ? t('salat.locating') : t('salat.useLocation')} onPress={request} loading={state === 'busy'} />
              {state === 'denied' ? <Text variant="small" muted>{t('salat.denied')}</Text> : null}
            </Card>
          ) : (
            <>
              <Text variant="heading">{t('salat.today')}</Text>
              <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: th.border }}>
                {data.slots.map((s, i) => {
                  const active = data.next.key === s.key && data.next.at.getDate() === s.at.getDate();
                  const isAlertable = s.key !== 'terbit';
                  const on = isAlertable && !!settings.prayerAlerts[s.key as AlertKey];
                  return (
                    <FadeIn key={s.key} index={i}>
                      <View
                        style={{
                          flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: 14,
                          backgroundColor: active ? th.surfaceAlt : th.surface,
                          borderTopWidth: i ? 1 : 0, borderTopColor: th.border,
                        }}
                      >
                        <Text style={{ flex: 1, fontWeight: active ? '700' : '400' }} color={active ? th.primary : th.text}>
                          {prayerName(t, s.key, s.at)}
                          {data.current === s.key ? '  •' : ''}
                        </Text>
                        <Text style={{ fontVariant: ['tabular-nums'], marginRight: space.lg, fontWeight: active ? '700' : '400' }} color={active ? th.primary : th.text}>
                          {s.hhmm}
                        </Text>
                        {isAlertable ? (
                          <Pressable
                            onPress={() => toggleAlert(s.key as AlertKey)}
                            accessibilityRole="switch"
                            accessibilityState={{ checked: on }}
                            accessibilityLabel={on ? t('salat.alertOn', { name: prayerName(t, s.key, s.at) }) : t('salat.alertOff', { name: prayerName(t, s.key, s.at) })}
                            style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? th.primary : th.surfaceAlt }}
                          >
                            {on ? <Bell size={20} color={th.onPrimary} /> : <BellOff size={20} color={th.muted} />}
                          </Pressable>
                        ) : (
                          <View style={{ width: 42 }} />
                        )}
                      </View>
                    </FadeIn>
                  );
                })}
              </View>

              <Pressable onPress={() => setShowMethod(!showMethod)} accessibilityRole="button">
                <Text variant="small" muted>
                  {t('salat.method')}: {METHODS[resolveMethod(settings.calcMethod, coords!)].label}
                  {settings.calcMethod === 'auto' ? ' (auto)' : ''} · {t('salat.asr')}: {settings.asrHanafi ? t('salat.asrHanafi') : t('salat.asrStandard')} ›
                </Text>
              </Pressable>
              {showMethod ? (
                <Card>
                  <Text variant="label">{t('salat.method')}</Text>
                  <Row>
                    {(['auto', ...Object.keys(METHODS)] as CalcMethod[]).map((m) => (
                      <Chip key={m} label={m === 'auto' ? 'Auto' : METHODS[m as Exclude<CalcMethod, 'auto'>].label} selected={settings.calcMethod === m} onPress={() => updateSettings({ calcMethod: m })} />
                    ))}
                  </Row>
                  <Toggle label={`${t('salat.asr')}: ${t('salat.asrHanafi')}`} value={settings.asrHanafi} onValueChange={(v) => updateSettings({ asrHanafi: v })} />
                </Card>
              ) : null}
              <Text variant="small" muted>{t('salat.disclaimer')}</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
