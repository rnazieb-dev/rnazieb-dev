import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View , ScrollView } from 'react-native';
import { QUOTES } from '@/content';
import { Button, Card, Pill, ProgressBar, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { QuoteCard } from '@/components/QuoteCard';
import { FadeIn, SproutHero } from '@/components/motion';
import { IconTile } from '@/components/icons/IconTile';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { useT } from '@/i18n/useT';
import { markQuoteSeen, missionRows } from '@/db/repos';
import { loadProgress } from '@/features/gamification/progress';
import { dueCounts } from '@/features/ledger/repo';
import { suggestedTab } from '@/features/adhkar/logic';
import { ensureAssignments } from '@/features/missions/service';
import { quoteOfDay } from '@/features/reminders/daily';
import { NAMA_BULAN_HIJRI, gregorianToHijri } from '@/lib/hijri';
import { formatDayLong, fromDayKey } from '@/lib/dates';
import { useApp, useDbQuery } from '@/state/app';

export default function Beranda() {
  const router = useRouter();
  const { db, today, settings, updateSettings, bump } = useApp();
  const { t } = useT();
  const quote = useMemo(() => quoteOfDay(QUOTES, today, settings.seed, settings.reminders.allowKhauf), [today, settings.seed, settings.reminders.allowKhauf]);
  const h = gregorianToHijri(fromDayKey(today));

  useEffect(() => {
    void markQuoteSeen(db, quote.id);
  }, [db, quote.id]);

  const progress = useDbQuery((d) => loadProgress(d, today), [today], null);
  const due = useDbQuery((d) => dueCounts(d, today, 7), [today], { overdue: 0, soon: 0 });
  const missions = useDbQuery(
    async (d) => {
      const level = (await loadProgress(d, today)).personal.level.level;
      const t = await ensureAssignments(d, today, settings.seed, level);
      const rows = await missionRows(d, [today]);
      return { daily: t.daily, done: new Set(rows.filter((r) => r.status === 'done').map((r) => r.mission_id)) };
    },
    [today, settings.seed],
    { daily: [], done: new Set<string>() },
  );

  const p = progress.data;
  const hide = settings.honorMode;
  const doneCount = missions.data.daily.filter((m) => missions.data.done.has(m.id)).length;

  return (
    <Screen>
      <FadeIn>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <SproutHero />
          <Text variant="title" style={{ textAlign: 'center' }}>Assalamu’alaikum{settings.displayName !== 'Hamba Allah' ? `, ${settings.displayName}` : ''}</Text>
          <Text variant="small" muted style={{ textAlign: 'center' }}>{formatDayLong(today)} · {h.day} {NAMA_BULAN_HIJRI[h.month - 1]} {h.year} H (perkiraan)</Text>
        </View>
      </FadeIn>
      {!settings.onboarded && !settings.introDismissed ? (
        <FadeIn index={1}>
          <Card tone="accent">
            <Text variant="heading">👋 Baru di NAFS?</Text>
            <Text muted>Silakan lihat-lihat dulu. Kalau sudah siap, kenali adabnya dan atur pengingat harian — hanya sekitar satu menit.</Text>
            <Row>
              <Button title="Mulai pengenalan" onPress={() => router.push('/onboarding')} />
              <Button title="Nanti saja" variant="ghost" onPress={() => updateSettings({ introDismissed: true })} />
            </Row>
          </Card>
        </FadeIn>
      ) : null}
      <FadeIn index={2}>
        <NextPrayerCard />
      </FadeIn>
      <FadeIn index={3}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          <IconTile size={56} label={t('hub.items.quran')} icon={{ glyph: 'quran' }} gradient="amber" onPress={() => router.push('/quran')} />
          <IconTile size={56} label={t('hub.items.qibla')} icon={{ glyph: 'kabah' }} gradient="night" onPress={() => router.push('/kiblat')} />
          <IconTile size={56} label={t('hub.items.tasbih')} icon={{ glyph: 'tasbih' }} gradient="teal" onPress={() => router.push('/tasbih')} />
          <IconTile size={56} label={t('hub.items.dhikrAll')} icon={{ glyph: 'quran' }} gradient="pink" onPress={() => router.push('/dzikir')} />
          <IconTile size={56} label={t('hub.items.hijri')} icon={{ glyph: 'kalender' }} gradient="sunset" onPress={() => router.push('/kalender')} />
          <IconTile size={56} label={t('hub.items.provision')} icon={{ glyph: 'bekal' }} gradient="sand" onPress={() => router.push('/bekal')} />
          <IconTile size={56} label={t('hub.items.secret')} icon={{ glyph: 'rahasia' }} gradient="indigo" onPress={() => router.push('/vault')} />
        </ScrollView>
      </FadeIn>
      <FadeIn index={4}>
        <QuoteCard quote={quote} />
      </FadeIn>
      <FadeIn index={5}>
        <Row>
          <Button title="Bekal hari ini" variant="secondary" onPress={() => router.push('/bekal')} />
          <Button title={`Dzikir ${suggestedTab(new Date().getHours()) === 'pagi' ? 'pagi' : 'petang'}`} variant="secondary" onPress={() => router.push('/adhkar')} />
        </Row>
      </FadeIn>
      {due.data.overdue + due.data.soon > 0 ? (
        <Card tone="accent">
          <Text variant="heading">Catatan jatuh tempo</Text>
          <Text muted>
            {due.data.overdue > 0 ? `${due.data.overdue} sudah lewat` : ''}
            {due.data.overdue > 0 && due.data.soon > 0 ? ' · ' : ''}
            {due.data.soon > 0 ? `${due.data.soon} dalam 7 hari` : ''}. Tunaikan dengan baik.
          </Text>
          <Button title="Buka catatan" variant="secondary" onPress={() => router.push('/ledger')} />
        </Card>
      ) : null}

      <FadeIn index={6}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading">Hari ini</Text>
          {p && !hide ? <Pill label={`Level ${p.personal.level.level} · ${p.personal.level.name}`} tone="accent" /> : null}
        </Row>
        {p && !hide ? (
          <>
            <ProgressBar value={p.personal.level.progress} />
            <Text muted>
              {p.personal.points} poin konsistensi{!settings.hideStreak ? ` · beruntun ${p.personal.streak} hari` : ''}
            </Text>
            {p.personal.secretCount > 0 ? <Text variant="small" color="#7a78c8">🔒 Amalan tersembunyi: {p.personal.secretCount}</Text> : null}
            {!p.personal.activeToday ? <Text variant="small" muted>Belum ada catatan hari ini. Satu kebaikan kecil pun berarti.</Text> : <Text variant="small" muted>Alhamdulillah, hari ini sudah ada amal tercatat.</Text>}
          </>
        ) : (
          <Text muted>{hide ? 'Mode ikhlas aktif: angka disembunyikan.' : 'Memuat…'}</Text>
        )}
        <Button title="Catat amal" onPress={() => router.push('/deed/new')} />
        <Row>
          <Button title="Niat pagi" variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'niat' } })} />
          <Button title="Muhasabah malam" variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'muhasabah' } })} />
        </Row>
      </Card>
      </FadeIn>

      <SectionTitle>Misi hari ini ({doneCount}/{missions.data.daily.length})</SectionTitle>
      {missions.data.daily.map((m, i) => (
        <FadeIn key={m.id} index={7 + i}>
        <Link href={{ pathname: '/mission/[id]', params: { id: m.id } }} asChild>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading" style={{ flex: 1 }}>{m.title}</Text>
              {missions.data.done.has(m.id) ? <Pill label="Selesai" tone="accent" /> : <Pill label={`${m.points} poin`} tone="muted" />}
            </Row>
            <Text muted>{m.description}</Text>
          </Card>
        </Link>
        </FadeIn>
      ))}
      <Button title="Lihat semua misi" variant="ghost" onPress={() => router.push('/(tabs)/misi')} />
      {progress.error || missions.error ? <Text color="#B3402F" onPress={bump}>Gagal memuat. Ketuk untuk mencoba lagi.</Text> : null}
      <Text variant="small" muted style={{ textAlign: 'center' }}>
        Tidak ada yang tahu kapan. Isi hari ini dengan yang terbaik.
      </Text>
    </Screen>
  );
}
