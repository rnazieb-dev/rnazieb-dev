import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share } from 'react-native';
import { Button, Card, Empty, Field, Pill, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { VisibilityPicker, type VisibilityValue } from '@/components/VisibilityPicker';
import { missionById } from '@/content';
import { missionRows } from '@/db/repos';
import { startSharedMission } from '@/features/circles/api';
import { queuePendingShared, retryPendingShared } from '@/features/missions/pending';
import { inviteMessage } from '@/features/circles/moderation';
import { useCircles } from '@/features/circles/useCircles';
import { assignmentDay, completeMission, skipMission } from '@/features/missions/service';
import { useT } from '@/i18n/useT';
import { CATEGORY_KEY, gradeKey } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase';
import { useApp, useDbQuery } from '@/state/app';

export default function MissionScreen() {
  const router = useRouter();
  const { id, shared, circle } = useLocalSearchParams<{ id: string; shared?: string; circle?: string }>();
  const mission = missionById(id);
  const { db, today, unlockVault, bump, syncNow, session } = useApp();
  const { circles, enabled } = useCircles();
  const [note, setNote] = useState('');
  const [vis, setVis] = useState<VisibilityValue>(shared && circle ? { visibility: 'circle', circleId: circle } : { visibility: mission?.canBeSecret ? 'secret' : 'public', circleId: null });
  const [busy, setBusy] = useState(false);
  const { t } = useT();
  const gradeLabel = (g: string) => { const k = gradeKey(g); return k ? t(k) : g; };

  const state = useDbQuery(
    async (d) => {
      if (!mission) return null;
      const rows = await missionRows(d, [assignmentDay(mission, today)]);
      return rows.find((r) => r.mission_id === mission.id)?.status ?? 'active';
    },
    [id, today],
    null as null | 'active' | 'done' | 'skipped',
  );

  if (!mission) return <Screen><Empty title={t('missions.detail.notFound')} /></Screen>;
  const done = state.data === 'done';

  const complete = async () => {
    setBusy(true);
    try {
      let dek: Uint8Array | null = null;
      if (vis.visibility === 'secret') {
        dek = await unlockVault();
        if (!dek) return Alert.alert(t('missions.detail.lockedTitle'), t('missions.detail.lockedBody'));
      }
      await completeMission(db, { mission, day: today, visibility: vis.visibility, circleId: vis.circleId, sharedId: shared ?? null, note, dek });
      bump();
      const sb = getSupabase();
      if (shared && sb) {
        await queuePendingShared(db, shared);
        await syncNow();
        const r = await retryPendingShared(db, async (sid) => {
          const { error } = await sb.rpc('mark_shared_done', { p_shared: sid });
          if (error) throw new Error(error.message);
        });
        Alert.alert(
          r.kept > 0 ? t('missions.detail.savedTitle') : t('missions.detail.alhamdulillah'),
          r.kept > 0
            ? t('missions.detail.savedPending')
            : t('missions.detail.savedSent'),
        );
      } else if (vis.visibility !== 'secret') {
        void syncNow();
      }
      router.back();
    } catch (e) {
      Alert.alert(t('missions.detail.cannotComplete'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const startTogether = async (circleId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      await startSharedMission(sb, circleId, mission.id, today);
      Alert.alert(t('missions.detail.sharedCreatedTitle'), t('missions.detail.sharedCreatedBody'));
    } catch (e) {
      Alert.alert(t('missions.failed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenGuard active={vis.visibility === 'secret'} id="mission" />
      <Text variant="title">{mission.title}</Text>
      <Row>
        <Pill label={t(CATEGORY_KEY[mission.category])} tone="muted" />
        <Pill label={t('missions.points', { n: mission.points })} tone="accent" />
        <Pill label={t('missions.detail.difficulty', { n: mission.difficulty })} tone="muted" />
      </Row>
      <Text>{mission.description}</Text>

      <Card>
        <Text variant="label">{t('missions.detail.basis')}</Text>
        {mission.dalil ? (
          <>
            <Text>{mission.dalil.gist}</Text>
            <Text variant="small" muted>{mission.dalil.source} · {gradeLabel(mission.dalil.grade)}</Text>
          </>
        ) : (
          <Text muted>{t('missions.detail.mubah')}</Text>
        )}
      </Card>

      {done ? (
        <Card tone="accent"><Text variant="heading">{t('missions.detail.alreadyDone')}</Text></Card>
      ) : (
        <>
          <SectionTitle>{t('missions.detail.complete')}</SectionTitle>
          <Field label={t('missions.detail.note')} value={note} onChangeText={setNote} multiline maxLength={500} />
          {shared && circle ? (
            <Card>
              <Text variant="label">{t('missions.detail.sharedTitle')}</Text>
              <Text muted>{t('missions.detail.sharedBody')}</Text>
            </Card>
          ) : (
            <VisibilityPicker value={vis} onChange={setVis} allowSecret={mission.canBeSecret} />
          )}
          <Button title={t('missions.detail.markDone')} onPress={complete} loading={busy} disabled={vis.visibility === 'circle' && !vis.circleId} />
          <Button title={t('missions.detail.skipToday')} variant="ghost" onPress={async () => { await skipMission(db, mission, today); bump(); router.back(); }} />
        </>
      )}

      {mission.canBeShared ? (
        <>
          <SectionTitle>{t('missions.detail.together')}</SectionTitle>
          <Text muted>{t('missions.detail.togetherBody', { n: mission.minPeople ?? 2 })}</Text>
          {enabled && session && circles.length > 0 ? (
            circles.map((c) => <Button key={c.circle.id} title={t('missions.detail.startIn', { name: c.circle.name })} variant="secondary" onPress={() => startTogether(c.circle.id)} loading={busy} />)
          ) : (
            <Text variant="small" muted>{t('missions.detail.togetherDisabled')}</Text>
          )}
          <Button title={t('missions.detail.shareInvite')} variant="ghost" onPress={() => Share.share({ message: inviteMessage({ missionTitle: mission.title }) })} />
        </>
      ) : null}
    </Screen>
  );
}
