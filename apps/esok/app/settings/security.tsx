import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Field, Screen, SectionTitle, Text, Toggle } from '@/components/ui';
import { PIN_KEY } from '@/components/LockGate';
import { wipeLocal } from '@/db/repos';
import { deleteMyAccount } from '@/features/circles/api';
import { shareExport } from '@/features/export/exportData';
import { canEnableAppLock, createPinRecord } from '@/features/security/lock';
import { rewrapPassphrase, unlockWithPassphrase } from '@/features/security/e2ee';
import { authAvailability, authenticate, wipeDek } from '@/features/security/vault';
import { fetchEnvelope, putEnvelope } from '@/features/sync/supabaseRemote';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';

export default function SecuritySettings() {
  const router = useRouter();
  const { db, settings, updateSettings, unlockVault, session, bump, lockVault } = useApp();
  const [hasPin, setHasPin] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [secured, setSecured] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(PIN_KEY).then((v) => setHasPin(!!v));
    void authAvailability().then((a) => setSecured(a.secured));
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {!secured ? <Card tone="accent"><Text>Perangkat ini belum memiliki kunci layar. Amalan rahasia tetap terenkripsi, tetapi sebaiknya aktifkan kunci layar/biometrik.</Text></Card> : null}

      <SectionTitle>Kunci aplikasi</SectionTitle>
      <Toggle
        label="Kunci aplikasi"
        hint="Minta biometrik/kode sandi perangkat (atau PIN) saat aplikasi dibuka kembali."
        value={settings.appLock}
        onValueChange={(v) => run(async () => {
          if (v && !canEnableAppLock({ secured, hasPin })) {
            return Alert.alert('Atur PIN dulu', 'Perangkat ini belum punya kunci layar. Atur PIN cadangan agar Anda tidak terkunci dari aplikasi.');
          }
          if (v && secured && !(await authenticate('Aktifkan kunci aplikasi'))) return;
          await updateSettings({ appLock: v });
        })}
      />
      <Card>
        <Text variant="label">PIN cadangan 6 digit {hasPin ? '(aktif)' : ''}</Text>
        <Field label="PIN baru" value={pin1} onChangeText={(v) => setPin1(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} />
        <Field label="Ulangi PIN" value={pin2} onChangeText={(v) => setPin2(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} />
        <Button
          title={hasPin ? 'Ganti PIN' : 'Atur PIN'}
          variant="secondary"
          disabled={pin1.length !== 6 || pin1 !== pin2}
          loading={busy}
          onPress={() => run(async () => {
            await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(await createPinRecord(pin1)));
            setHasPin(true); setPin1(''); setPin2('');
            Alert.alert('PIN tersimpan');
          })}
        />
        {hasPin ? (
          <Button
            title="Hapus PIN"
            variant="ghost"
            onPress={() => run(async () => {
              await SecureStore.deleteItemAsync(PIN_KEY);
              setHasPin(false);
              // Tanpa kunci layar & tanpa PIN, kunci aplikasi tak bisa dibuka → matikan.
              if (!canEnableAppLock({ secured, hasPin: false }) && settings.appLock) await updateSettings({ appLock: false });
            })}
          />
        ) : null}
        <Text variant="small" muted>PIN tidak dapat dipulihkan. Setelah beberapa kali salah, ada jeda bertahap.</Text>
      </Card>

      {session && settings.cloudEnabled ? (
        <>
          <SectionTitle>Passphrase cadangan cloud</SectionTitle>
          <Field label="Passphrase saat ini" value={oldPass} onChangeText={setOldPass} secureTextEntry />
          <Field label="Passphrase baru" value={newPass} onChangeText={setNewPass} secureTextEntry hint="Kunci pemulihan lama tetap berlaku." />
          <Button
            title="Ganti passphrase"
            variant="secondary"
            disabled={oldPass.length < 8 || newPass.length < 8}
            loading={busy}
            onPress={() => run(async () => {
              const sb = getSupabase();
              const dek = await unlockVault();
              if (!sb || !dek) return;
              const env = await fetchEnvelope(sb, session.user.id);
              if (!env) throw new Error('Envelope tidak ditemukan.');
              await unlockWithPassphrase(env, oldPass);
              await putEnvelope(sb, session.user.id, await rewrapPassphrase(env, dek, newPass));
              setOldPass(''); setNewPass('');
              Alert.alert('Passphrase diganti');
            })}
          />
        </>
      ) : null}

      <SectionTitle>Data Anda</SectionTitle>
      <Button
        title="Ekspor data (JSON)"
        variant="secondary"
        onPress={() => run(async () => {
          const dek = await unlockVault();
          if (!dek) return Alert.alert('Ekspor tanpa amalan rahasia', 'Verifikasi dibatalkan; hanya amal yang dibagikan yang diekspor.', [{ text: 'Batal', style: 'cancel' }, { text: 'Lanjut', onPress: () => void shareExport(db, null) }]);
          Alert.alert('Perhatian', 'Berkas ekspor tidak terenkripsi dan memuat amalan rahasia Anda. Simpan di tempat aman.', [{ text: 'Batal', style: 'cancel' }, { text: 'Ekspor', onPress: () => void shareExport(db, dek) }]);
        })}
      />
      <Button
        title="Hapus semua data di perangkat ini"
        variant="danger"
        onPress={() => Alert.alert('Hapus data lokal?', 'Seluruh catatan, refleksi, dan pengaturan di perangkat ini akan dihapus. Data di cloud (jika ada) tidak terhapus.', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: () => run(async () => { await wipeLocal(db); await wipeDek(); lockVault(); await SecureStore.deleteItemAsync(PIN_KEY); await updateSettings({ onboarded: false, appLock: false, cloudEnabled: false, boundUserId: null }); bump(); router.replace('/onboarding'); }) },
        ])}
      />
      {session ? (
        <Button
          title="Hapus akun & seluruh data cloud"
          variant="danger"
          onPress={() => Alert.alert('Hapus akun?', 'Akun dan SELURUH data cloud (amal dibagikan, amalan rahasia terenkripsi, keanggotaan lingkaran) dihapus permanen.', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus akun', style: 'destructive', onPress: () => run(async () => {
              const sb = getSupabase();
              if (!sb) return;
              await deleteMyAccount(sb);
              await sb.auth.signOut();
              await updateSettings({ cloudEnabled: false });
              Alert.alert('Akun dihapus', 'Data lokal di perangkat ini masih ada; hapus terpisah bila diinginkan.');
            }) },
          ])}
        />
      ) : null}
    </Screen>
  );
}
