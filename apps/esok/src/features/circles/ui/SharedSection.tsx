import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { missionById } from '@/content';
import { Button, Card, Empty, Pill, Row, Text } from '@/components/ui';
import { addDays } from '@/lib/dates';
import { getSupabase } from '@/lib/supabase';
import { type Circle, confirmSharedDone, joinSharedMission, loadSharedMissions } from '../api';
import { useAsync } from './useAsync';

export function SharedSection({ circle, uid, today }: { circle: Circle; uid: string; today: string }) {
  const sb = getSupabase()!;
  const router = useRouter();
  const list = useAsync(() => loadSharedMissions(sb, circle.id, addDays(today, -7)), [circle.id, today], []);
  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      list.reload();
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <>
      <Text muted>Misi yang dikerjakan bersama. Poin diberikan setelah peserta lain mengonfirmasi (konfirmasi sejawat). Mulai misi bersama dari halaman detail misi.</Text>
      {list.error ? <Text color="#B3402F">{list.error}</Text> : null}
      {!list.loading && list.data.length === 0 ? <Empty title="Belum ada misi bersama" body="Buka tab Misi, pilih misi bertanda “Bisa bersama”." /> : null}
      {list.data.map((s) => {
        const m = missionById(s.mission_id);
        const me = s.participants.find((p) => p.user_id === uid);
        return (
          <Card key={s.id}>
            <Text variant="heading">{m?.title ?? s.mission_id}</Text>
            <Text variant="small" muted>{s.day} · minimal {s.min_people} peserta</Text>
            {s.participants.map((p) => (
              <Row key={p.user_id} style={{ justifyContent: 'space-between' }}>
                <Text>{p.name}</Text>
                <Row>
                  <Pill label={p.confirmed ? 'Terkonfirmasi' : p.status === 'done' ? 'Menunggu konfirmasi' : 'Bergabung'} tone={p.confirmed ? 'accent' : 'muted'} />
                  {p.status === 'done' && !p.confirmed && p.user_id !== uid ? <Button title="Konfirmasi" variant="secondary" onPress={() => act(() => confirmSharedDone(sb, s.id, p.user_id))} /> : null}
                </Row>
              </Row>
            ))}
            {!me ? <Button title="Ikut" onPress={() => act(() => joinSharedMission(sb, s.id))} /> : null}
            {me && me.status === 'joined' && s.day === today ? (
              <Button title="Kerjakan & tandai selesai" onPress={() => router.push({ pathname: '/mission/[id]', params: { id: s.mission_id, shared: s.id, circle: circle.id } })} />
            ) : null}
          </Card>
        );
      })}
    </>
  );
}
