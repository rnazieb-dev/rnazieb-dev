import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Field, Screen, Text } from '@/components/ui';
import { joinCircle } from '@/features/circles/api';
import { getSupabase } from '@/lib/supabase';

export default function JoinCircle() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Text muted>Masukkan kode undangan dari admin grup. Permintaan Anda akan menunggu persetujuan admin.</Text>
      <Field label="Kode undangan" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={10} />
      <Button
        title="Kirim permintaan"
        loading={busy}
        disabled={code.trim().length < 6}
        onPress={async () => {
          const sb = getSupabase();
          if (!sb) return;
          setBusy(true);
          try {
            await joinCircle(sb, code);
            Alert.alert('Terkirim', 'Menunggu persetujuan admin.');
            router.back();
          } catch (e) {
            Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
