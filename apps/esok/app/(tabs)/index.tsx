import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { QUOTES } from '@/content';
import { Button, Card, Pill, ProgressBar, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { QuoteCard } from '@/components/QuoteCard';
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
  const { db, today, settings, bump } = useApp();
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
      <Text variant="small" muted>{formatDayLong(today)} · {h.day} {NAMA_BULAN_HIJRI[h.month - 1]} {h.year} H (perkiraan)</Text>
      <Text variant="title">Assalamu’alaikum{settings.displayName !== 'Hamba Allah' ? `, ${settings.displayName}` : ''}</Text>
      <QuoteCard quote={quote} />
      <Row>
        <Button title="Bekal hari ini" variant="secondary" onPress={() => router.push('/bekal')} />
        <Button title={`Dzikir ${suggestedTab(new Date().getHours()) === 'pagi' ? 'pagi' : 'petang'}`} variant="secondary" onPress={() => router.push('/adhkar')} />
      </Row>
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

      <SectionTitle>Misi hari ini ({doneCount}/{missions.data.daily.length})</SectionTitle>
      {missions.data.daily.map((m) => (
        <Link key={m.id} href={{ pathname: '/mission/[id]', params: { id: m.id } }} asChild>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading" style={{ flex: 1 }}>{m.title}</Text>
              {missions.data.done.has(m.id) ? <Pill label="Selesai" tone="accent" /> : <Pill label={`${m.points} poin`} tone="muted" />}
            </Row>
            <Text muted>{m.description}</Text>
          </Card>
        </Link>
      ))}
      <Button title="Lihat semua misi" variant="ghost" onPress={() => router.push('/(tabs)/misi')} />
      {progress.error || missions.error ? <Text color="#B3402F" onPress={bump}>Gagal memuat. Ketuk untuk mencoba lagi.</Text> : null}
      <Text variant="small" muted style={{ textAlign: 'center' }}>
        Tidak ada yang tahu kapan. Isi hari ini dengan yang terbaik.
      </Text>
    </Screen>
  );
}
