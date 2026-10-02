import { Alert, Share } from 'react-native';
import { Button, Card, Pill, Row, Text, Toggle } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { getSupabase } from '@/lib/supabase';
import {
  type Circle,
  approveMember,
  blockUser,
  listMembers,
  removeMember,
  sendNudge,
  updateCircleSettings,
} from '../api';
import { useAsync } from './useAsync';

export function MembersSection({ circle, uid, isAdmin, onLeft, onChanged }: { circle: Circle; uid: string; isAdmin: boolean; onLeft: () => void; onChanged: () => void }) {
  const sb = getSupabase()!;
  const { t } = useT();
  const members = useAsync(() => listMembers(sb, circle.id), [circle.id], []);
  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    try {
      await fn();
      members.reload();
      if (msg) Alert.alert(t('groups.sent'), msg);
    } catch (e) {
      Alert.alert(t('groups.failed'), e instanceof Error ? e.message : String(e));
    }
  };
  const pending = members.data.filter((m) => m.status === 'pending');
  const active = members.data.filter((m) => m.status === 'active');
  return (
    <>
      <Card>
        <Text variant="heading">{t('groups.members.inviteCode')}</Text>
        <Text selectable style={{ fontFamily: 'monospace', fontSize: 20 }}>{circle.invite_code}</Text>
        <Text variant="small" muted>{t('groups.members.approvalNote')}</Text>
        <Button title={t('groups.members.shareInvite')} variant="secondary" onPress={() => Share.share({ message: `${t('groups.members.inviteJoin', { name: circle.name, code: circle.invite_code })} ${t('groups.members.inviteTagline')}` })} />
      </Card>

      {isAdmin && pending.length > 0 ? (
        <Card tone="accent">
          <Text variant="heading">{t('groups.members.awaitingApproval')}</Text>
          {pending.map((m) => (
            <Row key={m.user_id} style={{ justifyContent: 'space-between' }}>
              <Text>{m.display_name}</Text>
              <Row>
                <Button title={t('groups.members.approve')} variant="secondary" onPress={() => act(() => approveMember(sb, circle.id, m.user_id))} />
                <Button title={t('groups.members.reject')} variant="ghost" onPress={() => act(() => removeMember(sb, circle.id, m.user_id))} />
              </Row>
            </Row>
          ))}
        </Card>
      ) : null}

      <Text variant="heading">{t('groups.members.count', { n: active.length })}</Text>
      {active.map((m) => (
        <Card key={m.user_id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">{m.display_name}</Text>
            {m.role === 'admin' ? <Pill label={t('groups.admin')} tone="accent" /> : null}
          </Row>
          {m.user_id !== uid ? (
            <Row>
              <Button title={t('groups.members.nudge')} variant="secondary" onPress={() => act(() => sendNudge(sb, circle.id, m.user_id, 'ingat'), t('groups.nudges.ingat'))} />
              <Button title={t('groups.members.pray')} variant="secondary" onPress={() => act(() => sendNudge(sb, circle.id, m.user_id, 'doa'), t('groups.nudges.doa'))} />
              {isAdmin ? <Button title={t('groups.members.kick')} variant="ghost" onPress={() => act(() => removeMember(sb, circle.id, m.user_id))} /> : null}
              <Button title={t('groups.block')} variant="ghost" onPress={() => act(() => blockUser(sb, m.user_id))} />
            </Row>
          ) : null}
        </Card>
      ))}

      {isAdmin ? (
        <Card>
          <Text variant="heading">{t('groups.members.settings')}</Text>
          <Toggle label={t('groups.members.showRanking')} value={circle.rankings_enabled} onValueChange={(v) => act(async () => { await updateCircleSettings(sb, circle.id, { rankings_enabled: v }); onChanged(); })} />
          <Toggle label={t('groups.members.allowComments')} value={circle.comments_enabled} onValueChange={(v) => act(async () => { await updateCircleSettings(sb, circle.id, { comments_enabled: v }); onChanged(); })} />
        </Card>
      ) : null}

      <Button
        title={t('groups.members.leave')}
        variant="danger"
        onPress={() => Alert.alert(t('groups.members.leaveTitle'), t('groups.members.leaveBody'), [
          { text: t('groups.cancel'), style: 'cancel' },
          { text: t('groups.members.leaveConfirm'), style: 'destructive', onPress: async () => { await act(() => removeMember(sb, circle.id, uid)); onLeft(); } },
        ])}
      />
    </>
  );
}
