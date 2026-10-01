import { type ReactNode, useState } from 'react';
import { Alert, View } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { space, useTheme } from '@/lib/theme';
import { useApp } from '@/state/app';
import { Button, Card, Text } from './ui';

/**
 * Bila sesi akun yang aktif BUKAN pemilik data lokal di perangkat ini, seluruh aplikasi diganti layar ini:
 * tidak ada jalan ke jurnal/vault/misi sampai data lokal dihapus atau pengguna keluar.
 */
export function AccountGate({ children }: { children: ReactNode }) {
  const { accountMismatch, resetLocalData } = useApp();
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  if (!accountMismatch) return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: space.xl, gap: space.lg }}>
      <Text variant="title">Akun berbeda</Text>
      <Card tone="accent">
        <Text>
          Data di perangkat ini milik akun lain. Demi privasi, data itu tidak ditampilkan kepada akun yang sedang masuk. Hapus data lokal untuk memakai akun ini
          (data di cloud akun lama tetap aman), atau keluar.
        </Text>
      </Card>
      <Button
        title="Hapus data lokal & lanjut"
        variant="danger"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await resetLocalData();
          } catch (e) {
            Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button title="Keluar" variant="ghost" onPress={() => void getSupabase()?.auth.signOut()} />
    </View>
  );
}
