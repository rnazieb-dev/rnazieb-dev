import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { Scene, phaseForHour } from './Scene';
import { nextPrayer, timesFor } from '@/features/salat/logic';
import { countdownText, prayerName, useNow } from '@/features/salat/ui';
import { useT } from '@/i18n/useT';
import { radius } from '@/lib/theme';
import { useApp } from '@/state/app';

/** Kartu Beranda: salat berikutnya + hitung mundur di atas pemandangan sesuai waktu. Ketuk → jadwal lengkap. */
export function NextPrayerCard() {
  const router = useRouter();
  const { t } = useT();
  const { settings } = useApp();
  const now = useNow(30000);
  const c = settings.coords;
  const opts = { method: settings.calcMethod, hanafi: settings.asrHanafi };
  const info = useMemo(() => (c ? { next: nextPrayer(now, c, opts), times: timesFor(now, c, opts) } : null), [c, now, settings.calcMethod, settings.asrHanafi]); // eslint-disable-line react-hooks/exhaustive-deps
  const phase = phaseForHour(now.getHours() + now.getMinutes() / 60, info?.times);
  const shadow = { textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 };
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/salat')} style={({ pressed }) => ({ borderRadius: radius.lg, overflow: 'hidden', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Scene phase={phase} height={150} />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
        <RNText style={{ color: '#fff', fontSize: 13, ...shadow }}>{t('home.nextPrayer')}</RNText>
        {info ? (
          <>
            <RNText style={{ color: '#fff', fontSize: 26, fontWeight: '800', ...shadow }}>{prayerName(t, info.next.key, info.next.at)} · {info.next.hhmm}</RNText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <RNText style={{ color: '#fff', ...shadow }}>{countdownText(t, info.next.at.getTime() - now.getTime())}</RNText>
              {settings.placeName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color="#fff" />
                  <RNText style={{ color: '#fff', fontSize: 13, ...shadow }}>{settings.placeName}</RNText>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <RNText style={{ color: '#fff', fontSize: 18, fontWeight: '700', ...shadow }}>{t('home.setLocation')} ›</RNText>
        )}
      </View>
    </Pressable>
  );
}
