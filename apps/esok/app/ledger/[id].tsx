import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chip, Field, Row, Screen, Text } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { parseRupiah } from '@/features/ledger/format';
import { listLedger, saveLedgerItem } from '@/features/ledger/repo';
import { LEDGER_LABEL, type LedgerPayload, type LedgerType } from '@/features/ledger/types';
import { addDays } from '@/lib/dates';
import { useApp } from '@/state/app';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TYPES: LedgerType[] = ['utang', 'piutang', 'amanah', 'wasiat'];

export default function LedgerForm() {
  const router = useRouter();
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
      if (!key) return Alert.alert('Terkunci', 'Catatan ini pribadi dan butuh verifikasi perangkat.');
      const payload: LedgerPayload = {
        type, title, counterparty, note,
        amountIdr: wasiat ? null : parseRupiah(amount),
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
      Alert.alert('Gagal menyimpan', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <Screen>
        <Text muted>Catatan bersifat pribadi & terenkripsi.</Text>
        <Button title="Buka dengan biometrik/kode sandi" onPress={() => unlockVault()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenGuard active id="ledger-form" />
      <Text variant="label">Jenis</Text>
      <Row>{TYPES.map((t) => <Chip key={t} label={LEDGER_LABEL[t]} selected={type === t} onPress={() => setType(t)} />)}</Row>
      <Field label={wasiat ? 'Judul wasiat' : 'Judul'} value={title} onChangeText={setTitle} maxLength={120} placeholder={wasiat ? 'mis. Wasiat untuk keluarga' : 'mis. Pinjaman modal usaha'} />
      <Field label={type === 'piutang' ? 'Kepada siapa' : wasiat ? 'Untuk siapa (opsional)' : 'Dengan siapa'} value={counterparty} onChangeText={setCounterparty} maxLength={80} />
      {!wasiat ? (
        <>
          <Field label="Nominal (Rp, opsional)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
          <Field label="Jatuh tempo (YYYY-MM-DD, opsional)" value={due} onChangeText={setDue} maxLength={10} autoCapitalize="none" hint={dueValid ? undefined : 'Format: 2026-12-31'} />
          <Row>
            <Chip label="+7 hari" onPress={() => setDue(addDays(today, 7))} />
            <Chip label="+30 hari" onPress={() => setDue(addDays(today, 30))} />
            <Chip label="Hapus tanggal" onPress={() => setDue('')} />
          </Row>
        </>
      ) : null}
      <Field label={wasiat ? 'Isi wasiat' : 'Catatan'} value={note} onChangeText={setNote} multiline maxLength={4000} hint={wasiat ? 'Tulis amanah, utang yang belum lunas, dan pesan untuk keluarga. Pembagian harta/waris: konsultasikan ahlinya.' : undefined} />
      <Button title="Simpan" onPress={save} loading={busy} disabled={!title.trim() || !dueValid} />
    </Screen>
  );
}
