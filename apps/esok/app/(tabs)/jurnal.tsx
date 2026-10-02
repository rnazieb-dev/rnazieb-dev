import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Empty, Row, Screen, SectionTitle, Text, Toggle } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { DeedItem } from '@/components/DeedItem';
import { activityDays, deleteDeed, getReflection, hasReflectionContent, listDeedsForDay, setUzur, uzurDays } from '@/db/repos';
import { useT } from '@/i18n/useT';
import { addDays, formatDayLong, fromDayKey } from '@/lib/dates';
import { radius, useTheme } from '@/lib/theme';
import { useApp, useDbQuery } from '@/state/app';

export default function Jurnal() {
  const router = useRouter();
  const t = useTheme();
  const { t: tr, tl } = useT();
  const HARI = tl('journal.screen.weekdays');
  const stripRef = useRef<ScrollView>(null);
  const { db, today, dek, unlockVault, bump } = useApp();
  const [day, setDay] = useState(today);
  const isToday = day === today;

  const deeds = useDbQuery((d) => listDeedsForDay(d, day, dek), [day, dek], []);
  const meta = useDbQuery(
    async (d) => ({
      uzur: (await uzurDays(d)).has(day),
      hasRefl: await hasReflectionContent(d, day),
      refl: dek ? await getReflection(d, dek, day) : null,
      active: await activityDays(d, { includeSecret: true }),
    }),
    [day, dek],
    { uzur: false, hasRefl: false, refl: null, active: new Set<string>() },
  );
  const lockedCount = deeds.data.filter((x) => x.locked).length;

  const strip = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  const remove = (id: string) =>
    Alert.alert(tr('journal.screen.deleteTitle'), tr('journal.screen.deleteBody'), [
      { text: tr('journal.common.cancel'), style: 'cancel' },
      { text: tr('journal.common.delete'), style: 'destructive', onPress: async () => { await deleteDeed(db, id); bump(); } },
    ]);

  return (
    <Screen>
      <ScreenGuard active={!!dek} id="jurnal" />
      <Text variant="title">{tr('journal.screen.title')}</Text>
      <ScrollView ref={stripRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} onContentSizeChange={() => stripRef.current?.scrollToEnd({ animated: false })}>
        {strip.map((k) => {
          const sel = k === day;
          const active = meta.data.active.has(k);
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={formatDayLong(k)}
              onPress={() => setDay(k)}
              style={{
                width: 44, paddingVertical: 6, borderRadius: radius.md, alignItems: 'center', gap: 2,
                backgroundColor: sel ? t.primary : t.surface,
                borderWidth: 1, borderColor: sel ? t.primary : t.border,
              }}
            >
              <Text variant="small" color={sel ? t.onPrimary : t.muted}>{HARI[fromDayKey(k).getDay()]}</Text>
              <Text variant="heading" color={sel ? t.onPrimary : t.text}>{Number(k.slice(8))}</Text>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: active ? (sel ? t.onPrimary : t.accent) : 'transparent' }} />
            </Pressable>
          );
        })}
      </ScrollView>
      <Row style={{ justifyContent: 'space-between' }}>
        <Button title="‹" variant="secondary" onPress={() => setDay(addDays(day, -1))} accessibilityLabel={tr('journal.screen.prevDay')} />
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>{formatDayLong(day)}</Text>
        <Button title="›" variant="secondary" onPress={() => setDay(addDays(day, 1))} disabled={isToday} accessibilityLabel={tr('journal.screen.nextDay')} />
      </Row>

      <Button title={tr('journal.screen.addDeed')} onPress={() => router.push({ pathname: '/deed/new', params: { day } })} />

      {lockedCount > 0 ? (
        <Card tone="secret">
          <Text>{tr('journal.screen.lockedCount', { n: lockedCount })}</Text>
          <Button title={tr('journal.common.open')} variant="secondary" onPress={() => unlockVault()} />
        </Card>
      ) : null}

      {deeds.data.length === 0 ? <Empty title={tr('journal.screen.emptyTitle')} body={tr('journal.screen.emptyBody')} /> : null}
      {deeds.data.filter((x) => !x.locked).map((d) => (
        <DeedItem key={d.id} deed={d} onDelete={() => remove(d.id)} />
      ))}

      <SectionTitle>{tr('journal.screen.reflection')}</SectionTitle>
      <Card tone="secret">
        {meta.data.refl && (meta.data.refl.niat || meta.data.refl.syukur || meta.data.refl.tekad) ? (
          <>
            {meta.data.refl.niat ? <Text><Text style={{ fontWeight: '700' }}>{tr('journal.screen.niyyah')}</Text>{meta.data.refl.niat}</Text> : null}
            {meta.data.refl.syukur ? <Text><Text style={{ fontWeight: '700' }}>{tr('journal.screen.gratitude')}</Text>{meta.data.refl.syukur}</Text> : null}
            {meta.data.refl.penyesalan ? <Text><Text style={{ fontWeight: '700' }}>{tr('journal.screen.improve')}</Text>{meta.data.refl.penyesalan}</Text> : null}
            {meta.data.refl.tekad ? <Text><Text style={{ fontWeight: '700' }}>{tr('journal.screen.resolve')}</Text>{meta.data.refl.tekad}</Text> : null}
          </>
        ) : (
          <Text muted>{meta.data.hasRefl && !dek ? tr('journal.screen.reflLocked') : tr('journal.screen.reflEmpty')}</Text>
        )}
        {isToday ? (
          <Row>
            <Button title={tr('journal.screen.morningNiyyah')} variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'niat' } })} />
            <Button title={tr('journal.screen.muhasabah')} variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'muhasabah' } })} />
          </Row>
        ) : null}
      </Card>

      <Toggle
        label={tr('journal.screen.uzur')}
        hint={tr('journal.screen.uzurHint')}
        value={meta.data.uzur}
        onValueChange={async (v) => { await setUzur(db, day, v); bump(); }}
      />
    </Screen>
  );
}
