import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chip, Field, Row, Screen, Text } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { parseMoney } from '@/features/support/money';
import { useCurrency } from '@/features/support/useRegion';
import { listLedger, saveLedgerItem } from '@/features/ledger/repo';
import { type LedgerPayload, type LedgerType } from '@/features/ledger/types';
import { addDays } from '@/lib/dates';
import { useT } from '@/i18n/useT';
import { useApp } from '@/state/app';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TYPES: LedgerType[] = ['utang', 'piutang', 'amanah', 'wasiat'];

export default function LedgerForm() {
  const router = useRouter();
  const { t: tr } = useT();
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { db, today, dek, unlockVault, bump, reschedule } = useApp();
  const [type, setType] = useState<LedgerType>('utang');
  const [title, setTitle] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [due, setDue] = useState('');
  const [prev, setPrev] = useState<LedgerPayload | null>(null);
  const [ready, setReady] = useState(isNew);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    void (async () => {
      const key = dek ?? (await unlockVault());
      if (!key) return;
      const cur = (await listLedger(db, key)).find((x) => x.id === id);
      if (!cur || !alive) return;
      setPrev(cur);
      setType(cur.type);
      setTitle(cur.title);
      setCounterparty(cur.counterparty);
      setAmount(cur.amountIdr !== null ? String(cur.amountIdr) : '');
      setNote(cur.note);
      setDue(cur.dueDay ?? '');
      setReady(true);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const wasiat = type === 'wasiat';
  const dueValid = due === '' || DAY_RE.test(due);

  const save = async () => {
    setBusy(true);
    try {
      const key = dek ?? (await unlockVault());
      if (!key) return Alert.alert(tr('journal.common.locked'), tr('journal.ledger.form.lockedBody'));
      const payload: LedgerPayload = {
        type, title, counterparty, note,
        amountIdr: wasiat ? null : parseMoney(amount),
        dueDay: wasiat || !due ? null : due,
        createdDay: prev?.createdDay ?? today,
        settled: prev?.settled ?? false,
        settledDay: prev?.settledDay ?? null,
      };
      await saveLedgerItem(db, key, payload, isNew ? undefined : id);
      bump();
      void reschedule();
      router.back();
    } catch (e) {
      Alert.alert(tr('journal.common.saveFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <Screen>
        <Text muted>{tr('journal.ledger.form.privateNote')}</Text>
        <Button title={tr('journal.common.unlockBiometric')} onPress={() => unlockVault()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenGuard active id="ledger-form" />
      <Text variant="label">{tr('journal.ledger.form.type')}</Text>
      <Row>{TYPES.map((t) => <Chip key={t} label={tr(`journal.ledger.types.${t}`)} selected={type === t} onPress={() => setType(t)} />)}</Row>
      <Field label={wasiat ? tr('journal.ledger.form.willTitle') : tr('journal.ledger.form.titleLabel')} value={title} onChangeText={setTitle} maxLength={120} placeholder={wasiat ? tr('journal.ledger.form.willTitlePlaceholder') : tr('journal.ledger.form.titlePlaceholder')} />
      <Field label={type === 'piutang' ? tr('journal.ledger.form.toWhom') : wasiat ? tr('journal.ledger.form.forWhom') : tr('journal.ledger.form.withWhom')} value={counterparty} onChangeText={setCounterparty} maxLength={80} />
      {!wasiat ? (
        <>
          <Field label={tr('money.amountLabel', { code: currency.code })} value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
          <Field label={tr('journal.ledger.form.due')} value={due} onChangeText={setDue} maxLength={10} autoCapitalize="none" hint={dueValid ? undefined : tr('journal.ledger.form.dueFormat')} />
          <Row>
            <Chip label={tr('journal.ledger.form.plus7')} onPress={() => setDue(addDays(today, 7))} />
            <Chip label={tr('journal.ledger.form.plus30')} onPress={() => setDue(addDays(today, 30))} />
            <Chip label={tr('journal.ledger.form.clearDate')} onPress={() => setDue('')} />
          </Row>
        </>
      ) : null}
      <Field label={wasiat ? tr('journal.ledger.form.willBody') : tr('journal.ledger.form.note')} value={note} onChangeText={setNote} multiline maxLength={4000} hint={wasiat ? tr('journal.ledger.form.willHint') : undefined} />
      <Button title={tr('journal.common.save')} onPress={save} loading={busy} disabled={!title.trim() || !dueValid} />
    </Screen>
  );
}
