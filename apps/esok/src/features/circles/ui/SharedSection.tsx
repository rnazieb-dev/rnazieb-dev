import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { missionById } from '@/content';
import { Button, Card, Empty, Pill, Row, Text } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { addDays } from '@/lib/dates';
import { getSupabase } from '@/lib/supabase';
import { type Circle, confirmSharedDone, joinSharedMission, loadSharedMissions } from '../api';
import { useAsync } from './useAsync';

export function SharedSection({ circle, uid, today }: { circle: Circle; uid: string; today: string }) {
  const sb = getSupabase()!;
  const router = useRouter();
  const { t } = useT();
  const list = useAsync(() => loadSharedMissions(sb, circle.id, addDays(today, -7)), [circle.id, today], []);
  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      list.reload();
    } catch (e) {
      Alert.alert(t('groups.failed'), e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <>
      <Text muted>{t('groups.shared.intro')}</Text>
      {list.error ? <Text color="#B3402F">{list.error}</Text> : null}
      {!list.loading && list.data.length === 0 ? <Empty title={t('groups.shared.emptyTitle')} body={t('groups.shared.emptyBody')} /> : null}
      {list.data.map((s) => {
        const m = missionById(s.mission_id);
        const me = s.participants.find((p) => p.user_id === uid);
        return (
          <Card key={s.id}>
            <Text variant="heading">{m?.title ?? s.mission_id}</Text>
            <Text variant="small" muted>{t('groups.shared.meta', { day: s.day, n: s.min_people })}</Text>
            {s.participants.map((p) => (
              <Row key={p.user_id} style={{ justifyContent: 'space-between' }}>
                <Text>{p.name}</Text>
                <Row>
                  <Pill label={p.confirmed ? t('groups.shared.confirmed') : p.status === 'done' ? t('groups.shared.awaitingConfirm') : t('groups.shared.joined')} tone={p.confirmed ? 'accent' : 'muted'} />
                  {p.status === 'done' && !p.confirmed && p.user_id !== uid ? <Button title={t('groups.shared.confirm')} variant="secondary" onPress={() => act(() => confirmSharedDone(sb, s.id, p.user_id))} /> : null}
                </Row>
              </Row>
            ))}
            {!me ? <Button title={t('groups.shared.join')} onPress={() => act(() => joinSharedMission(sb, s.id))} /> : null}
            {me && me.status === 'joined' && s.day === today ? (
              <Button title={t('groups.shared.doAndMark')} onPress={() => router.push({ pathname: '/mission/[id]', params: { id: s.mission_id, shared: s.id, circle: circle.id } })} />
            ) : null}
          </Card>
        );
      })}
    </>
  );
}
