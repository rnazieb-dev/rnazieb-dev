import { Alert, Share } from 'react-native';
import { Button, Card, Pill, Row, Text, Toggle } from '@/components/ui';
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
import { NUDGE_TEXT, inviteMessage } from '../moderation';
import { useAsync } from './useAsync';

export function MembersSection({ circle, uid, isAdmin, onLeft, onChanged }: { circle: Circle; uid: string; isAdmin: boolean; onLeft: () => void; onChanged: () => void }) {
  const sb = getSupabase()!;
  const members = useAsync(() => listMembers(sb, circle.id), [circle.id], []);
  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    try {
      await fn();
      members.reload();
      if (msg) Alert.alert('Terkirim', msg);
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
    }
  };
  const pending = members.data.filter((m) => m.status === 'pending');
  const active = members.data.filter((m) => m.status === 'active');
  return (
    <>
      <Card>
        <Text variant="heading">Kode undangan</Text>
        <Text selectable style={{ fontFamily: 'monospace', fontSize: 20 }}>{circle.invite_code}</Text>
        <Text variant="small" muted>Setiap yang bergabung perlu persetujuan admin.</Text>
        <Button title="Bagikan ajakan" variant="secondary" onPress={() => Share.share({ message: inviteMessage({ circleName: circle.name, code: circle.invite_code }) })} />
      </Card>

      {isAdmin && pending.length > 0 ? (
        <Card tone="accent">
          <Text variant="heading">Menunggu persetujuan</Text>
          {pending.map((m) => (
            <Row key={m.user_id} style={{ justifyContent: 'space-between' }}>
              <Text>{m.display_name}</Text>
              <Row>
                <Button title="Setujui" variant="secondary" onPress={() => act(() => approveMember(sb, circle.id, m.user_id))} />
                <Button title="Tolak" variant="ghost" onPress={() => act(() => removeMember(sb, circle.id, m.user_id))} />
              </Row>
            </Row>
          ))}
        </Card>
      ) : null}

      <Text variant="heading">Anggota ({active.length})</Text>
      {active.map((m) => (
        <Card key={m.user_id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">{m.display_name}</Text>
            {m.role === 'admin' ? <Pill label="Admin" tone="accent" /> : null}
          </Row>
          {m.user_id !== uid ? (
            <Row>
              <Button title="Ingatkan kebaikan" variant="secondary" onPress={() => act(() => sendNudge(sb, circle.id, m.user_id, 'ingat'), NUDGE_TEXT.ingat)} />
              <Button title="Kirim doa" variant="secondary" onPress={() => act(() => sendNudge(sb, circle.id, m.user_id, 'doa'), NUDGE_TEXT.doa)} />
              {isAdmin ? <Button title="Keluarkan" variant="ghost" onPress={() => act(() => removeMember(sb, circle.id, m.user_id))} /> : null}
              <Button title="Blokir" variant="ghost" onPress={() => act(() => blockUser(sb, m.user_id))} />
            </Row>
          ) : null}
        </Card>
      ))}

      {isAdmin ? (
        <Card>
          <Text variant="heading">Pengaturan grup</Text>
          <Toggle label="Tampilkan peringkat kontribusi" value={circle.rankings_enabled} onValueChange={(v) => act(async () => { await updateCircleSettings(sb, circle.id, { rankings_enabled: v }); onChanged(); })} />
          <Toggle label="Izinkan komentar" value={circle.comments_enabled} onValueChange={(v) => act(async () => { await updateCircleSettings(sb, circle.id, { comments_enabled: v }); onChanged(); })} />
        </Card>
      ) : null}

      <Button
        title="Keluar dari grup"
        variant="danger"
        onPress={() => Alert.alert('Keluar?', 'Anda tidak akan melihat grup ini lagi.', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', style: 'destructive', onPress: async () => { await act(() => removeMember(sb, circle.id, uid)); onLeft(); } },
        ])}
      />
    </>
  );
}
