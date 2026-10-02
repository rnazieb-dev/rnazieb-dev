import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chip, Field, Row, Screen, Text } from '@/components/ui';
import { type CircleKind, createCircle } from '@/features/circles/api';
import { getSupabase } from '@/lib/supabase';

const KINDS: { key: CircleKind; label: string; hint: string }[] = [
  { key: 'keluarga', label: 'Keluarga', hint: 'Untuk keluarga inti/besar.' },
  { key: 'sesama_jenis', label: 'Sesama jenis', hint: 'Anggota sesama jenis agar nyaman.' },
  { key: 'campur', label: 'Terbuka', hint: 'Sahabat, kantor, komunitas.' },
];

export default function NewCircle() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CircleKind>('keluarga');
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Field label="Nama grup" value={name} onChangeText={setName} maxLength={60} placeholder="mis. Keluarga Besar Bani Fulan" />
      <Text variant="label">Jenis</Text>
      <Row>{KINDS.map((k) => <Chip key={k.key} label={k.label} selected={kind === k.key} onPress={() => setKind(k.key)} />)}</Row>
      <Text variant="small" muted>{KINDS.find((k) => k.key === kind)?.hint} Anggota baru selalu perlu persetujuan Anda.</Text>
      <Button
        title="Buat"
        loading={busy}
        disabled={!name.trim()}
        onPress={async () => {
          const sb = getSupabase();
          if (!sb) return;
          setBusy(true);
          try {
            const id = await createCircle(sb, name.trim(), kind);
            router.replace({ pathname: '/circle/[id]', params: { id } });
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
