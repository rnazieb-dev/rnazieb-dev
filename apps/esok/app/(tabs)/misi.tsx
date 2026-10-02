import { Button, Card, Empty, Screen, SectionTitle, Text } from '@/components/ui';
import { MissionCard } from '@/components/MissionCard';
import { missionRows } from '@/db/repos';
import { loadProgress } from '@/features/gamification/progress';
import { assignmentDay, ensureAssignments } from '@/features/missions/service';
import { weekStart } from '@/lib/dates';
import { useApp, useDbQuery } from '@/state/app';

export default function Misi() {
  const { today, settings, bump } = useApp();
  const q = useDbQuery(
    async (d) => {
      const level = (await loadProgress(d, today)).personal.level.level;
      const t = await ensureAssignments(d, today, settings.seed, level);
      const rows = await missionRows(d, [today, weekStart(today)]);
      const done = new Set(rows.filter((r) => r.status === 'done').map((r) => `${r.mission_id}|${r.day}`));
      return { t, done, level };
    },
    [today, settings.seed],
    null,
  );
  if (!q.data) return <Screen><Text muted>{q.error ?? 'Memuat…'}</Text>{q.error ? <Button title="Coba lagi" onPress={bump} /> : null}</Screen>;
  const { t, done } = q.data;
  const isDone = (m: { id: string; cadence: 'daily' | 'weekly' | 'seasonal' | 'side' }) =>
    done.has(`${m.id}|${assignmentDay(m as never, today)}`);
  return (
    <Screen>
      <Text variant="title">Misi</Text>
      <Text muted>Misi kecil, sedikit tapi rutin. Poin hanyalah penanda konsistensi, bukan nilai pahala. Tidak ada undian atau hadiah acak.</Text>

      <SectionTitle>Harian</SectionTitle>
      {t.daily.map((m) => <MissionCard key={m.id} mission={m} done={isDone(m)} />)}

      <SectionTitle>Pekan ini</SectionTitle>
      {t.weekly.map((m) => <MissionCard key={m.id} mission={m} done={isDone(m)} />)}

      {t.seasonal.length > 0 ? (
        <>
          <SectionTitle>Hari/musim istimewa</SectionTitle>
          <Text variant="small" muted>Penanggalan Hijriah di sini perkiraan; ikuti penetapan resmi setempat.</Text>
          {t.seasonal.map((m) => <MissionCard key={m.id} mission={m} done={isDone(m)} />)}
        </>
      ) : null}

      <SectionTitle>Side quest</SectionTitle>
      {t.side ? (
        <Card tone="accent">
          <Text variant="label">Kejutan hari ini</Text>
          <MissionCard mission={t.side} done={isDone(t.side)} />
        </Card>
      ) : (
        <Empty title="Belum ada side quest hari ini" body="Kejutan kecil muncul di sebagian hari." />
      )}
    </Screen>
  );
}
