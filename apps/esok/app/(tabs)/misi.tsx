import { Button, Card, Empty, Screen, SectionTitle, Text } from '@/components/ui';
import { MissionCard } from '@/components/MissionCard';
import { missionRows } from '@/db/repos';
import { loadProgress } from '@/features/gamification/progress';
import { assignmentDay, ensureAssignments } from '@/features/missions/service';
import { weekStart } from '@/lib/dates';
import { useT } from '@/i18n/useT';
import { useApp, useDbQuery } from '@/state/app';

export default function Misi() {
  const { today, settings, bump } = useApp();
  const { t: tr } = useT();
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
  if (!q.data) return <Screen><Text muted>{q.error ?? tr('missions.loading')}</Text>{q.error ? <Button title={tr('missions.retry')} onPress={bump} /> : null}</Screen>;
  const { t, done } = q.data;
  const isDone = (m: { id: string; cadence: 'daily' | 'weekly' | 'seasonal' | 'side' }) =>
    done.has(`${m.id}|${assignmentDay(m as never, today)}`);
  return (
    <Screen>
      <Text variant="title">{tr('missions.list.title')}</Text>
      <Text muted>{tr('missions.list.intro')}</Text>

      <SectionTitle>{tr('missions.list.daily')}</SectionTitle>
      {t.daily.map((m) => <MissionCard key={m.id} mission={m} done={isDone(m)} />)}

      <SectionTitle>{tr('missions.list.weekly')}</SectionTitle>
      {t.weekly.map((m) => <MissionCard key={m.id} mission={m} done={isDone(m)} />)}

      {t.seasonal.length > 0 ? (
        <>
          <SectionTitle>{tr('missions.list.seasonal')}</SectionTitle>
          <Text variant="small" muted>{tr('missions.list.seasonalNote')}</Text>
          {t.seasonal.map((m) => <MissionCard key={m.id} mission={m} done={isDone(m)} />)}
        </>
      ) : null}

      <SectionTitle>{tr('missions.list.side')}</SectionTitle>
      {t.side ? (
        <Card tone="accent">
          <Text variant="label">{tr('missions.list.sideToday')}</Text>
          <MissionCard mission={t.side} done={isDone(t.side)} />
        </Card>
      ) : (
        <Empty title={tr('missions.list.sideEmptyTitle')} body={tr('missions.list.sideEmptyBody')} />
      )}
    </Screen>
  );
}
