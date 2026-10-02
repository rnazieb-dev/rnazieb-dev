import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Empty, Field, ProgressBar, Row, Text } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { addDays } from '@/lib/dates';
import { getSupabase } from '@/lib/supabase';
import { type Circle, contribute, createChallenge, loadChallenges } from '../api';
import { useAsync } from './useAsync';

export function ChallengeSection({ circle, isAdmin, today }: { circle: Circle; isAdmin: boolean; today: string }) {
  const sb = getSupabase()!;
  const { t } = useT();
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
      Alert.alert(t('groups.failed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text muted>{t('groups.challenge.intro')}</Text>
      {list.error ? <Text color="#B3402F">{list.error}</Text> : null}
      {!list.loading && list.data.length === 0 ? <Empty title={t('groups.challenge.emptyTitle')} body={isAdmin ? t('groups.challenge.emptyAdmin') : t('groups.challenge.emptyMember')} /> : null}
      {list.data.map((c) => {
        const active = today >= c.starts_on && today <= c.ends_on;
        return (
          <Card key={c.id} tone={active ? 'accent' : undefined}>
            <Text variant="heading">{c.title}</Text>
            {c.description ? <Text muted>{c.description}</Text> : null}
            <ProgressBar value={c.total / c.target} />
            <Text>{t('groups.challenge.progress', { total: c.total, target: c.target, unit: c.unit, n: c.contributors })}</Text>
            <Text variant="small" muted>{t('groups.challenge.range', { from: c.starts_on, to: c.ends_on })}{active ? '' : t('groups.challenge.inactive')}</Text>
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
          <Text variant="heading">{t('groups.challenge.createTitle')}</Text>
          <Field label={t('groups.challenge.titleLabel')} value={title} onChangeText={setTitle} maxLength={80} placeholder={t('groups.challenge.titlePlaceholder')} />
          <Row>
            <Field label={t('groups.challenge.target')} value={target} onChangeText={(v) => setTarget(v.replace(/\D/g, ''))} keyboardType="number-pad" />
            <Field label={t('groups.challenge.unit')} value={unit} onChangeText={setUnit} maxLength={20} />
            <Field label={t('groups.challenge.duration')} value={days} onChangeText={(v) => setDays(v.replace(/\D/g, ''))} keyboardType="number-pad" />
          </Row>
          <Button
            title={t('groups.create')}
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
