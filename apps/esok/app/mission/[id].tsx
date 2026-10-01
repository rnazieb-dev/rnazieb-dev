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
import { CATEGORY_LABEL } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase';
import { useApp, useDbQuery } from '@/state/app';

const GRADE: Record<string, string> = { sahih: 'Shahih', hasan: 'Hasan', quran: "Al-Qur'an" };

export default function MissionScreen() {
  const router = useRouter();
  const { id, shared, circle } = useLocalSearchParams<{ id: string; shared?: string; circle?: string }>();
  const mission = missionById(id);
  const { db, today, unlockVault, bump, syncNow, session } = useApp();
  const { circles, enabled } = useCircles();
  const [note, setNote] = useState('');
  const [vis, setVis] = useState<VisibilityValue>(shared && circle ? { visibility: 'circle', circleId: circle } : { visibility: mission?.canBeSecret ? 'secret' : 'public', circleId: null });
  const [busy, setBusy] = useState(false);

  const state = useDbQuery(
    async (d) => {
      if (!mission) return null;
      const rows = await missionRows(d, [assignmentDay(mission, today)]);
      return rows.find((r) => r.mission_id === mission.id)?.status ?? 'active';
    },
    [id, today],
    null as null | 'active' | 'done' | 'skipped',
  );

  if (!mission) return <Screen><Empty title="Misi tidak ditemukan" /></Screen>;
  const done = state.data === 'done';

  const complete = async () => {
    setBusy(true);
    try {
      let dek: Uint8Array | null = null;
      if (vis.visibility === 'secret') {
        dek = await unlockVault();
        if (!dek) return Alert.alert('Terkunci', 'Amalan rahasia butuh verifikasi perangkat.');
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
          r.kept > 0 ? 'Tersimpan' : 'Alhamdulillah',
          r.kept > 0
            ? 'Misi tercatat di perangkat, tetapi tanda selesai belum terkirim. Akan dicoba lagi otomatis saat online.'
            : 'Tandai selesai terkirim. Poin diberikan setelah teman sesama peserta mengonfirmasi.',
        );
      } else if (vis.visibility !== 'secret') {
        void syncNow();
      }
      router.back();
    } catch (e) {
      Alert.alert('Tidak dapat menyelesaikan', e instanceof Error ? e.message : String(e));
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
      Alert.alert('Misi bersama dibuat', 'Anggota lingkaran dapat bergabung dari halaman lingkaran.');
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenGuard active={vis.visibility === 'secret'} id="mission" />
      <Text variant="title">{mission.title}</Text>
      <Row>
        <Pill label={CATEGORY_LABEL[mission.category]} tone="muted" />
        <Pill label={`${mission.points} poin`} tone="accent" />
        <Pill label={`Tingkat ${mission.difficulty}`} tone="muted" />
      </Row>
      <Text>{mission.description}</Text>

      <Card>
        <Text variant="label">Dasar</Text>
        {mission.dalil ? (
          <>
            <Text>{mission.dalil.gist}</Text>
            <Text variant="small" muted>{mission.dalil.source} · {GRADE[mission.dalil.grade]}</Text>
          </>
        ) : (
          <Text muted>Kebaikan umum (mubah). Esok tidak mengklaim keutamaan atau pahala tertentu untuk misi ini.</Text>
        )}
      </Card>

      {done ? (
        <Card tone="accent"><Text variant="heading">Misi ini sudah selesai. Alhamdulillah.</Text></Card>
      ) : (
        <>
          <SectionTitle>Selesaikan</SectionTitle>
          <Field label="Catatan (opsional)" value={note} onChangeText={setNote} multiline maxLength={500} />
          <VisibilityPicker value={vis} onChange={setVis} allowSecret={mission.canBeSecret && !shared} />
          <Button title="Tandai selesai" onPress={complete} loading={busy} disabled={vis.visibility === 'circle' && !vis.circleId} />
          <Button title="Lewati hari ini" variant="ghost" onPress={async () => { await skipMission(db, mission, today); bump(); router.back(); }} />
        </>
      )}

      {mission.canBeShared ? (
        <>
          <SectionTitle>Kerjakan bersama</SectionTitle>
          <Text muted>Ajak {mission.minPeople ?? 2}+ orang. Poin diberikan setelah peserta lain mengonfirmasi (konfirmasi sejawat).</Text>
          {enabled && session && circles.length > 0 ? (
            circles.map((c) => <Button key={c.circle.id} title={`Mulai di “${c.circle.name}”`} variant="secondary" onPress={() => startTogether(c.circle.id)} loading={busy} />)
          ) : (
            <Text variant="small" muted>Aktifkan akun & cloud dan gabung ke lingkaran untuk mengerjakan bersama.</Text>
          )}
          <Button title="Bagikan ajakan" variant="ghost" onPress={() => Share.share({ message: inviteMessage({ missionTitle: mission.title }) })} />
        </>
      ) : null}
    </Screen>
  );
}
