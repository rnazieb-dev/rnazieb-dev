import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Empty, Row, Screen, SectionTitle, Text, Toggle } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { DeedItem } from '@/components/DeedItem';
import { activityDays, deleteDeed, getReflection, hasReflectionContent, listDeedsForDay, setUzur, uzurDays } from '@/db/repos';
import { addDays, formatDayLong, fromDayKey } from '@/lib/dates';
import { radius, useTheme } from '@/lib/theme';
import { useApp, useDbQuery } from '@/state/app';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function Jurnal() {
  const router = useRouter();
  const t = useTheme();
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
    Alert.alert('Hapus catatan?', 'Catatan akan dihapus dari perangkat ini dan perangkat lain.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteDeed(db, id); bump(); } },
    ]);

  return (
    <Screen>
      <ScreenGuard active={!!dek} id="jurnal" />
      <Text variant="title">Jurnal amal</Text>
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
        <Button title="‹" variant="secondary" onPress={() => setDay(addDays(day, -1))} accessibilityLabel="Hari sebelumnya" />
        <Text variant="heading" style={{ flex: 1, textAlign: 'center' }}>{formatDayLong(day)}</Text>
        <Button title="›" variant="secondary" onPress={() => setDay(addDays(day, 1))} disabled={isToday} accessibilityLabel="Hari berikutnya" />
      </Row>

      <Button title="Catat amal" onPress={() => router.push({ pathname: '/deed/new', params: { day } })} />

      {lockedCount > 0 ? (
        <Card tone="secret">
          <Text>🔒 {lockedCount} amalan rahasia pada hari ini.</Text>
          <Button title="Buka" variant="secondary" onPress={() => unlockVault()} />
        </Card>
      ) : null}

      {deeds.data.length === 0 ? <Empty title="Belum ada catatan" body="Satu kebaikan kecil pun layak dicatat." /> : null}
      {deeds.data.filter((x) => !x.locked).map((d) => (
        <DeedItem key={d.id} deed={d} onDelete={() => remove(d.id)} />
      ))}

      <SectionTitle>Refleksi</SectionTitle>
      <Card tone="secret">
        {meta.data.refl && (meta.data.refl.niat || meta.data.refl.syukur || meta.data.refl.tekad) ? (
          <>
            {meta.data.refl.niat ? <Text><Text style={{ fontWeight: '700' }}>Niat: </Text>{meta.data.refl.niat}</Text> : null}
            {meta.data.refl.syukur ? <Text><Text style={{ fontWeight: '700' }}>Syukur: </Text>{meta.data.refl.syukur}</Text> : null}
            {meta.data.refl.penyesalan ? <Text><Text style={{ fontWeight: '700' }}>Perbaikan: </Text>{meta.data.refl.penyesalan}</Text> : null}
            {meta.data.refl.tekad ? <Text><Text style={{ fontWeight: '700' }}>Tekad: </Text>{meta.data.refl.tekad}</Text> : null}
          </>
        ) : (
          <Text muted>{meta.data.hasRefl && !dek ? '🔒 Ada refleksi tersimpan. Buka vault untuk membaca.' : 'Belum ada refleksi.'}</Text>
        )}
        {isToday ? (
          <Row>
            <Button title="Niat pagi" variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'niat' } })} />
            <Button title="Muhasabah" variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'muhasabah' } })} />
          </Row>
        ) : null}
      </Card>

      <Toggle
        label="Hari uzur"
        hint="Sakit, haid, safar, atau halangan lain. Hari uzur tidak memutus rangkaian hari beramal."
        value={meta.data.uzur}
        onValueChange={async (v) => { await setUzur(db, day, v); bump(); }}
      />
    </Screen>
  );
}
