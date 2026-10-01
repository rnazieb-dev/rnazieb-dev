import { usePreventScreenCapture } from 'expo-screen-capture';
import { Alert } from 'react-native';
import { Button, Card, Empty, Screen, Text } from '@/components/ui';
import { DeedItem } from '@/components/DeedItem';
import { deleteDeed, listSecretDeeds } from '@/db/repos';
import { formatDayLong } from '@/lib/dates';
import { useApp, useDbQuery } from '@/state/app';

export default function Vault() {
  usePreventScreenCapture('vault');
  const { db, dek, unlockVault, lockVault, bump } = useApp();
  const q = useDbQuery((d) => listSecretDeeds(d, dek), [dek], []);
  const remove = (id: string) =>
    Alert.alert('Hapus amalan rahasia?', 'Ini tidak dapat dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteDeed(db, id); bump(); } },
    ]);

  let lastDay = '';
  return (
    <Screen>
      <Text variant="title">Amalan rahasia</Text>
      <Text muted>
        Hanya Anda yang dapat membaca. Terenkripsi di perangkat; tidak pernah masuk feed, peringkat, kartu ajakan, atau notifikasi siapa pun.
        Poinnya hanya menambah skor pribadi Anda.
      </Text>
      {!dek ? (
        <Card tone="secret">
          <Text>🔒 {q.data.length} amalan tersembunyi. Buka dengan biometrik/kode sandi perangkat untuk membaca isinya.</Text>
          <Button title="Buka" onPress={() => unlockVault()} />
        </Card>
      ) : (
        <Button title="Kunci sekarang" variant="secondary" onPress={lockVault} />
      )}
      {dek && q.data.length === 0 ? <Empty title="Belum ada amalan rahasia" body="Pilih “Rahasia” saat mencatat amal." /> : null}
      {dek
        ? q.data.map((d) => {
            const header = d.day !== lastDay ? (lastDay = d.day) : null;
            return (
              <Card key={d.id} style={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}>
                {header ? <Text variant="label" muted>{formatDayLong(header)}</Text> : null}
                <DeedItem deed={d} onDelete={() => remove(d.id)} />
              </Card>
            );
          })
        : null}
    </Screen>
  );
}
