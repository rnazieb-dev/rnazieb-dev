import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share } from 'react-native';
import { wipeLocal } from '@/db/repos';
import { bindingState } from '@/features/sync/binding';
import { Button, Card, Field, Screen, Text, Toggle } from '@/components/ui';
import { connectCloudVault, ensureLocalDek, wipeDek } from '@/features/security/vault';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';

/** Akun & cloud: opsional. Tanpa akun, semua fitur pribadi tetap berfungsi (offline). */
export default function Auth() {
  const router = useRouter();
  const { session, settings, updateSettings, db, cloudConfigured, syncNow, sync, bump, lockVault, resetLocalData } = useApp();
  const sb = getSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk');
  const [passphrase, setPassphrase] = useState('');
  const [recovery, setRecovery] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [consent, setConsent] = useState(false);
  const [shownKey, setShownKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (settings.isMinor) {
    return (
      <Screen>
        <Text variant="title">Tidak tersedia</Text>
        <Text muted>Akun & cloud tersedia untuk pengguna 13 tahun ke atas.</Text>
      </Screen>
    );
  }

  if (!cloudConfigured || !sb) {
    return (
      <Screen>
        <Text variant="title">Cloud belum dikonfigurasi</Text>
        <Text muted>Aplikasi tetap berfungsi penuh secara lokal. Pemilik aplikasi perlu mengisi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY (lihat docs/esok/DEPLOY.md).</Text>
      </Screen>
    );
  }

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

  const submitAuth = () =>
    run(async () => {
      const r = mode === 'masuk' ? await sb.auth.signInWithPassword({ email: email.trim(), password }) : await sb.auth.signUp({ email: email.trim(), password });
      if (r.error) throw new Error(r.error.message);
      if (mode === 'daftar' && !r.data.session) Alert.alert('Periksa email', 'Konfirmasi email Anda, lalu masuk.');
    });

  const connect = () =>
    run(async () => {
      if (!session) return;
      const local = await ensureLocalDek();
      const res = await connectCloudVault(sb, session.user.id, db, local, useRecovery ? { recoveryKey: recovery } : { passphrase });
      if (res.recoveryKey) {
        setShownKey(res.recoveryKey);
        return;
      }
      await updateSettings({ cloudEnabled: true, boundUserId: session.user.id });
      await syncNow();
      router.back();
    });

  const switchAccount = () => run(resetLocalData);

  const signOut = () =>
    Alert.alert('Keluar', 'Hapus juga data lokal di perangkat ini? Disarankan bila perangkat dipakai bergantian.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar saja', onPress: () => void sb.auth.signOut() },
      {
        text: 'Keluar & hapus data lokal',
        style: 'destructive',
        onPress: () => run(async () => {
          await sb.auth.signOut();
          await wipeLocal(db);
          await wipeDek();
          lockVault();
          await updateSettings({ cloudEnabled: false, boundUserId: null, onboarded: false });
          bump();
          router.replace('/onboarding');
        }),
      },
    ]);

  const finishAfterKey = () =>
    run(async () => {
      await updateSettings({ cloudEnabled: true, boundUserId: session?.user.id ?? null });
      setShownKey(null);
      await syncNow();
      router.back();
    });

  if (shownKey) {
    return (
      <Screen>
        <Text variant="title">Simpan kunci pemulihan</Text>
        <Text>Jika Anda lupa passphrase, kunci ini satu-satunya cara memulihkan amalan rahasia di cloud. Esok tidak menyimpannya dan tidak dapat membantu memulihkannya.</Text>
        <Card tone="accent"><Text selectable style={{ fontFamily: 'monospace', fontSize: 16 }}>{shownKey}</Text></Card>
        <Button title="Salin/bagikan ke tempat aman" variant="secondary" onPress={() => Share.share({ message: `Kunci pemulihan Esok:\n${shownKey}` })} />
        <Toggle label="Saya sudah menyimpannya di tempat yang aman" value={saved} onValueChange={setSaved} />
        <Button title="Selesai" onPress={finishAfterKey} disabled={!saved} loading={busy} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Text variant="title">{mode === 'masuk' ? 'Masuk' : 'Daftar'}</Text>
        <Text muted>Akun dipakai untuk lingkaran, tantangan, dan cadangan lintas perangkat.</Text>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} hint={mode === 'daftar' ? 'Minimal 8 karakter.' : undefined} />
        <Button title={mode === 'masuk' ? 'Masuk' : 'Daftar'} onPress={submitAuth} loading={busy} disabled={!email || password.length < 8} />
        <Button title={mode === 'masuk' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'} variant="ghost" onPress={() => setMode(mode === 'masuk' ? 'daftar' : 'masuk')} />
        <Text variant="small" muted>Masuk dengan Google/Apple menyusul setelah kredensial OAuth dikonfigurasi pemilik aplikasi.</Text>
      </Screen>
    );
  }

  if (bindingState(settings.boundUserId, session.user.id) === 'other') {
    return (
      <Screen>
        <Text variant="title">Akun berbeda</Text>
        <Card tone="accent">
          <Text>Data lokal di perangkat ini milik akun lain. Agar data tidak tercampur atau terbaca akun ini, hapus data lokal terlebih dahulu (data di cloud akun lama tetap aman).</Text>
        </Card>
        <Button title="Hapus data lokal & lanjut" variant="danger" onPress={switchAccount} loading={busy} />
        <Button title="Batal & keluar" variant="ghost" onPress={() => sb.auth.signOut()} />
      </Screen>
    );
  }

  if (!settings.cloudEnabled) {
    return (
      <Screen>
        <Text variant="title">Aktifkan cloud</Text>
        <Card>
          <Text>• Amal yang Anda bagikan (Lingkaran/Publik) disimpan di server agar teman dapat melihatnya.</Text>
          <Text>• Amalan rahasia & refleksi hanya diunggah sebagai ciphertext terenkripsi; server tidak dapat membacanya.</Text>
          <Text>• Anda dapat menghapus akun dan seluruh data kapan saja di Pengaturan.</Text>
        </Card>
        <Toggle label="Saya setuju data dikirim ke cloud seperti di atas" value={consent} onValueChange={setConsent} />
        <Text variant="label">Amankan cadangan rahasia</Text>
        {useRecovery ? (
          <Field label="Kunci pemulihan" value={recovery} onChangeText={setRecovery} autoCapitalize="characters" autoCorrect={false} />
        ) : (
          <Field label="Passphrase" value={passphrase} onChangeText={setPassphrase} secureTextEntry hint="Min. 8 karakter. Perangkat baru memerlukan passphrase ini. Jika sudah pernah membuat di perangkat lain, masukkan yang sama." />
        )}
        <Button title="Aktifkan" onPress={connect} loading={busy} disabled={!consent || (useRecovery ? recovery.length < 10 : passphrase.length < 8)} />
        <Button title={useRecovery ? 'Pakai passphrase' : 'Lupa passphrase? Pakai kunci pemulihan'} variant="ghost" onPress={() => setUseRecovery(!useRecovery)} />
        <Button title="Keluar" variant="ghost" onPress={signOut} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title">Cloud aktif</Text>
      <Text muted>{session.user.email}</Text>
      <Card>
        <Text>Status sinkron: {sync.state === 'ok' ? `terakhir ${sync.at?.slice(11, 16) ?? ''} UTC` : sync.state === 'error' ? `gagal — ${sync.message}` : sync.state === 'syncing' ? 'menyinkronkan…' : 'siap'}</Text>
        <Button title="Sinkronkan sekarang" variant="secondary" onPress={syncNow} />
      </Card>
      <Button title="Matikan cloud (data lokal tetap)" variant="secondary" onPress={async () => { await updateSettings({ cloudEnabled: false }); bump(); }} />
      <Button title="Keluar" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
