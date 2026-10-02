import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Chip, Empty, Pill, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { countLedger, deleteLedgerItem, listLedger, settleLedgerItem } from '@/features/ledger/repo';
import { formatRupiah } from '@/features/ledger/format';
import { LEDGER_LABEL, type LedgerType } from '@/features/ledger/types';
import { daysBetween, formatDayLong } from '@/lib/dates';
import { useApp, useDbQuery } from '@/state/app';

const FILTERS: (LedgerType | 'semua')[] = ['semua', 'utang', 'piutang', 'amanah', 'wasiat'];

function dueText(due: string | null, today: string): string | null {
  if (!due) return null;
  const d = daysBetween(today, due);
  if (d < 0) return `Lewat ${-d} hari (${formatDayLong(due)})`;
  if (d === 0) return 'Jatuh tempo hari ini';
  return `Jatuh tempo ${formatDayLong(due)} (${d} hari lagi)`;
}

export default function LedgerScreen() {
  const router = useRouter();
  const { db, today, dek, unlockVault, bump, reschedule } = useApp();
  const [filter, setFilter] = useState<LedgerType | 'semua'>('semua');
  const items = useDbQuery((d) => (dek ? listLedger(d, dek) : Promise.resolve([])), [dek], []);
  const counts = useDbQuery((d) => countLedger(d), [], { total: 0, open: 0 });
  const shown = items.data.filter((x) => filter === 'semua' || x.type === filter);

  const remove = (id: string) =>
    Alert.alert('Hapus catatan?', 'Catatan dihapus dari perangkat ini dan perangkat lain.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteLedgerItem(db, id); bump(); void reschedule(); } },
    ]);

  return (
    <Screen>
      <ScreenGuard active={!!dek} id="ledger" />
      <Text variant="title">Utang, amanah & wasiat</Text>
      <Card tone="accent">
        <Text>“Jiwa seorang mukmin tergantung pada utangnya hingga utang itu dilunasi.” — HR. Tirmidzi no. 1078</Text>
        <Text>“Tidak pantas bagi seorang muslim yang memiliki sesuatu yang hendak diwasiatkan, bermalam dua malam kecuali wasiatnya tertulis di sisinya.” — HR. Bukhari no. 2738 & Muslim no. 1627</Text>
      </Card>
      <Text muted>Terenkripsi di perangkat seperti amalan rahasia. Server tidak dapat membacanya, dan tidak masuk poin, feed, atau peringkat.</Text>

      {!dek ? (
        <Card tone="secret">
          <Text>🔒 {counts.data.total} catatan tersimpan ({counts.data.open} belum selesai). Buka dengan biometrik/kode sandi perangkat untuk membaca.</Text>
          <Button title="Buka" onPress={() => unlockVault()} />
        </Card>
      ) : (
        <>
          <Button title="Tambah catatan" onPress={() => router.push({ pathname: '/ledger/[id]', params: { id: 'new' } })} />
          <Row>
            {FILTERS.map((f) => <Chip key={f} label={f === 'semua' ? 'Semua' : LEDGER_LABEL[f]} selected={filter === f} onPress={() => setFilter(f)} />)}
          </Row>
          {shown.length === 0 ? <Empty title="Belum ada catatan" body="Catat utang yang harus ditunaikan, piutang, amanah, atau wasiat Anda." /> : null}
          {shown.map((x) => {
            const due = x.settled ? null : dueText(x.dueDay, today);
            const overdue = !x.settled && x.dueDay !== null && x.dueDay < today;
            return (
              <Card key={x.id} tone={x.type === 'wasiat' ? 'secret' : undefined}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="heading" style={{ flex: 1 }}>{x.title}</Text>
                  <Pill label={x.settled ? 'Selesai' : LEDGER_LABEL[x.type]} tone={x.settled ? 'muted' : 'accent'} />
                </Row>
                {x.counterparty ? <Text muted>{x.type === 'piutang' ? 'Kepada' : x.type === 'wasiat' ? 'Untuk' : 'Dengan'}: {x.counterparty}</Text> : null}
                {x.amountIdr !== null ? <Text variant="heading">{formatRupiah(x.amountIdr)}</Text> : null}
                {x.note ? <Text>{x.note}</Text> : null}
                {due ? <Text color={overdue ? '#B3402F' : undefined} variant="label">{due}</Text> : null}
                {x.type === 'piutang' && !x.settled ? <Text variant="small" muted>Jika yang berutang kesulitan, beri tenggang waktu (QS Al-Baqarah 2:280).</Text> : null}
                {x.type === 'wasiat' ? <Text variant="small" muted>Untuk pembagian harta/waris dan batasan wasiat, konsultasikan ustadz/ahli waris/notaris; Esok bukan pengganti.</Text> : null}
                <Row>
                  {x.type !== 'wasiat' ? (
                    <Button title={x.settled ? 'Batalkan selesai' : x.type === 'amanah' ? 'Tunaikan' : 'Tandai lunas'} variant="secondary" onPress={async () => { await settleLedgerItem(db, dek, x.id, !x.settled, today); bump(); void reschedule(); }} />
                  ) : null}
                  <Button title="Ubah" variant="ghost" onPress={() => router.push({ pathname: '/ledger/[id]', params: { id: x.id } })} />
                  <Button title="Hapus" variant="ghost" onPress={() => remove(x.id)} />
                </Row>
              </Card>
            );
          })}
          <SectionTitle>Catatan</SectionTitle>
          <Text variant="small" muted>Pengingat jatuh tempo memakai teks generik (tanpa nama/nominal). Atur di Profil › Pengingat.</Text>
        </>
      )}
    </Screen>
  );
}
