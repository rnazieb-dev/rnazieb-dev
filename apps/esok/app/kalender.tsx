import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { FadeIn } from '@/components/motion';
import { Card, Row, Screen, Text } from '@/components/ui';
import { monthGrid, sunnahFastHint } from '@/features/salat/calendar';
import { useT } from '@/i18n/useT';
import { NAMA_BULAN_HIJRI, gregorianToHijri } from '@/lib/hijri';
import { radius, space, useTheme } from '@/lib/theme';

export default function Kalender() {
  const th = useTheme();
  const { t, tl, lang } = useT();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const cells = useMemo(() => monthGrid(ym.y, ym.m, now), [ym]); // eslint-disable-line react-hooks/exhaustive-deps
  const shift = (d: number) => setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const title = new Date(ym.y, ym.m, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { month: 'long', year: 'numeric' });
  const inMonth = cells.filter((c) => c.inMonth);
  const hijriSpan = [...new Set(inMonth.map((c) => `${NAMA_BULAN_HIJRI[c.hijri.month - 1]} ${c.hijri.year}`))].join(' – ');
  const todayH = gregorianToHijri(now);

  return (
    <Screen>
      <Text variant="title">{t('calendar.title')}</Text>
      <FadeIn>
        <Card tone="accent">
          <Text variant="label" muted>{t('calendar.today')}</Text>
          <Text variant="heading">{todayH.day} {NAMA_BULAN_HIJRI[todayH.month - 1]} {todayH.year} H</Text>
        </Card>
      </FadeIn>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => shift(-1)} accessibilityRole="button" style={{ padding: 8 }}><ChevronLeft color={th.text} /></Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text variant="heading">{title}</Text>
          <Text variant="small" muted>{hijriSpan}</Text>
        </View>
        <Pressable onPress={() => shift(1)} accessibilityRole="button" style={{ padding: 8 }}><ChevronRight color={th.text} /></Pressable>
      </Row>
      <View style={{ flexDirection: 'row' }}>
        {tl('calendar.weekdays').map((w) => (
          <RNText key={w} style={{ flex: 1, textAlign: 'center', color: th.muted, fontWeight: '600', fontSize: 12 }}>{w}</RNText>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((c, i) => {
          const hint = c.inMonth ? sunnahFastHint(c) : null;
          return (
            <View key={i} style={{ width: `${100 / 7}%`, padding: 2 }}>
              <View
                style={{
                  borderRadius: radius.md, paddingVertical: 6, alignItems: 'center', minHeight: 54,
                  backgroundColor: c.isToday ? th.primary : c.inMonth ? th.surface : 'transparent',
                  opacity: c.inMonth ? 1 : 0.4,
                }}
              >
                <RNText style={{ color: c.isToday ? th.onPrimary : th.text, fontWeight: '700', fontSize: 15 }}>{c.date.getDate()}</RNText>
                <RNText style={{ color: c.isToday ? th.onPrimary : th.accent, fontSize: 11 }}>{c.hijri.day}</RNText>
                {hint ? <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: c.isToday ? th.onPrimary : th.primary }} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      <Text variant="small" muted>{t('calendar.legend')}</Text>
      <Text variant="small" muted style={{ marginTop: space.sm }}>{t('calendar.note')}</Text>
    </Screen>
  );
}
