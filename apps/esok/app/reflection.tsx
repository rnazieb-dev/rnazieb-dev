import { usePreventScreenCapture } from 'expo-screen-capture';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Field, Screen, Text } from '@/components/ui';
import { EMPTY_REFLECTION, type Reflection, getReflection, saveReflection } from '@/db/repos';
import { useApp } from '@/state/app';

export default function ReflectionScreen() {
  usePreventScreenCapture('reflection');
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: 'niat' | 'muhasabah' }>();
  const { db, today, dek, unlockVault, bump } = useApp();
  const [r, setR] = useState<Reflection>({ ...EMPTY_REFLECTION });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const key = dek ?? (await unlockVault());
      if (!key) return;
      const cur = await getReflection(db, key, today);
      if (alive) {
        setR(cur);
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const key = dek ?? (await unlockVault());
      if (!key) return Alert.alert('Terkunci', 'Refleksi bersifat pribadi dan butuh verifikasi perangkat.');
      await saveReflection(db, key, today, r);
      bump();
      router.back();
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <Screen>
        <Text muted>Refleksi bersifat pribadi & terenkripsi.</Text>
        <Button title="Buka dengan biometrik/kode sandi" onPress={async () => { const k = await unlockVault(); if (k) { setR(await getReflection(db, k, today)); setReady(true); } }} />
      </Screen>
    );
  }

  return (
    <Screen>
      {mode !== 'muhasabah' ? (
        <>
          <Text variant="title">Niat pagi</Text>
          <Card>
            <Text muted>“Sesungguhnya setiap amal tergantung niatnya.” — HR. Bukhari no. 1 & Muslim no. 1907</Text>
          </Card>
          <Field label="Hari ini, kebaikan apa yang ingin kulakukan karena Allah?" value={r.niat} onChangeText={(v) => setR({ ...r, niat: v })} multiline maxLength={800} />
        </>
      ) : (
        <>
          <Text variant="title">Muhasabah malam</Text>
          <Card>
            <Text muted>“…hendaklah setiap orang memperhatikan apa yang telah diperbuatnya untuk hari esok.” — QS Al-Hasyr 59:18</Text>
          </Card>
          <Field label="Yang patut disyukuri hari ini" value={r.syukur} onChangeText={(v) => setR({ ...r, syukur: v })} multiline maxLength={800} />
          <Field label="Yang disesali / perlu diperbaiki" value={r.penyesalan} onChangeText={(v) => setR({ ...r, penyesalan: v })} multiline maxLength={800} hint="Mohon ampun kepada Allah; Dia Maha Pengampun." />
          <Field label="Tekad untuk esok (jika Allah menghendaki)" value={r.tekad} onChangeText={(v) => setR({ ...r, tekad: v })} multiline maxLength={800} />
        </>
      )}
      <Button title="Simpan" onPress={save} loading={busy} />
    </Screen>
  );
}
