import { type ReactNode, useState } from 'react';
import { Alert, View } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { space, useTheme } from '@/lib/theme';
import { useApp } from '@/state/app';
import { useT } from '@/i18n/useT';
import { Button, Card, Text } from './ui';

/**
 * Bila sesi akun yang aktif BUKAN pemilik data lokal di perangkat ini, seluruh aplikasi diganti layar ini:
 * tidak ada jalan ke jurnal/vault/misi sampai data lokal dihapus atau pengguna keluar.
 */
export function AccountGate({ children }: { children: ReactNode }) {
  const { accountMismatch, resetLocalData } = useApp();
  const t = useTheme();
  const { t: tr } = useT();
  const [busy, setBusy] = useState(false);
  if (!accountMismatch) return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: space.xl, gap: space.lg }}>
      <Text variant="title">{tr('prefs.shared.differentAccount')}</Text>
      <Card tone="accent">
        <Text>{tr('prefs.account.body')}</Text>
      </Card>
      <Button
        title={tr('prefs.shared.wipeLocalContinue')}
        variant="danger"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await resetLocalData();
          } catch (e) {
            Alert.alert(tr('prefs.shared.failed'), e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button title={tr('prefs.shared.signOut')} variant="ghost" onPress={() => void getSupabase()?.auth.signOut()} />
    </View>
  );
}
