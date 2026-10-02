import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Empty, Field, ProgressBar, Row, Text } from '@/components/ui';
import { addDays } from '@/lib/dates';
import { getSupabase } from '@/lib/supabase';
import { type Circle, contribute, createChallenge, loadChallenges } from '../api';
import { useAsync } from './useAsync';

export function ChallengeSection({ circle, isAdmin, today }: { circle: Circle; isAdmin: boolean; today: string }) {
  const sb = getSupabase()!;
  const list = useAsync(() => loadChallenges(sb, circle.id), [circle.id], []);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('100');
  const [unit, setUnit] = useState('amal');
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      list.reload();
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text muted>Target bersama grup. Yang dihitung adalah kebaikan kolektif, bukan urutan siapa terbanyak.</Text>
      {list.error ? <Text color="#B3402F">{list.error}</Text> : null}
      {!list.loading && list.data.length === 0 ? <Empty title="Belum ada tantangan" body={isAdmin ? 'Buat tantangan pertama untuk grup.' : 'Admin dapat membuat tantangan.'} /> : null}
      {list.data.map((c) => {
        const active = today >= c.starts_on && today <= c.ends_on;
        return (
          <Card key={c.id} tone={active ? 'accent' : undefined}>
            <Text variant="heading">{c.title}</Text>
            {c.description ? <Text muted>{c.description}</Text> : null}
            <ProgressBar value={c.total / c.target} />
            <Text>{c.total} / {c.target} {c.unit} · {c.contributors} penyumbang</Text>
            <Text variant="small" muted>{c.starts_on} s.d. {c.ends_on}{active ? '' : ' (tidak aktif)'}</Text>
            {active ? (
              <Row>
                {[1, 5, 10].map((n) => (
                  <Button key={n} title={`+${n}`} variant="secondary" onPress={() => act(() => contribute(sb, c.id, n))} loading={busy} />
                ))}
              </Row>
            ) : null}
          </Card>
        );
      })}
      {isAdmin ? (
        <Card>
          <Text variant="heading">Buat tantangan</Text>
          <Field label="Judul" value={title} onChangeText={setTitle} maxLength={80} placeholder="mis. Sedekah subuh 100 kali" />
          <Row>
            <Field label="Target" value={target} onChangeText={(v) => setTarget(v.replace(/\D/g, ''))} keyboardType="number-pad" />
            <Field label="Satuan" value={unit} onChangeText={setUnit} maxLength={20} />
            <Field label="Durasi (hari)" value={days} onChangeText={(v) => setDays(v.replace(/\D/g, ''))} keyboardType="number-pad" />
          </Row>
          <Button
            title="Buat"
            disabled={!title.trim() || !Number(target) || !Number(days)}
            loading={busy}
            onPress={() => act(async () => {
              await createChallenge(sb, circle.id, { title, description: '', target: Number(target), unit: unit || 'amal', starts_on: today, ends_on: addDays(today, Math.min(366, Number(days)) - 1) });
              setTitle('');
            })}
          />
        </Card>
      ) : null}
    </>
  );
}
