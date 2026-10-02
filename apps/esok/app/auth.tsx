import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Share } from 'react-native';
import { wipeLocal } from '@/db/repos';
import { bindingState } from '@/features/sync/binding';
import { Button, Card, Field, Screen, Text, Toggle } from '@/components/ui';
import { connectCloudVault, ensureLocalDek, wipeDek } from '@/features/security/vault';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';
import { useT } from '@/i18n/useT';

/** Akun & cloud: opsional. Tanpa akun, semua fitur pribadi tetap berfungsi (offline). */
export default function Auth() {
  const router = useRouter();
  const { session, settings, updateSettings, db, cloudConfigured, syncNow, sync, bump, lockVault, resetLocalData } = useApp();
  const sb = getSupabase();
  const { t } = useT();
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

  if (!settings.onboarded) {
    return (
      <Screen>
        <Text variant="title">{t('prefs.auth.introTitle')}</Text>
        <Text muted>{t('prefs.auth.introBody')}</Text>
        <Button title={t('prefs.auth.introStart')} onPress={() => router.push('/onboarding')} />
      </Screen>
    );
  }

  if (settings.isMinor) {
    return (
      <Screen>
        <Text variant="title">{t('prefs.auth.unavailableTitle')}</Text>
        <Text muted>{t('prefs.auth.unavailableBody')}</Text>
      </Screen>
    );
  }

  if (!cloudConfigured || !sb) {
    return (
      <Screen>
        <Text variant="title">{t('prefs.auth.notConfiguredTitle')}</Text>
        <Text muted>{t('prefs.auth.notConfiguredBody')}</Text>
      </Screen>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(t('prefs.shared.failed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const submitAuth = () =>
    run(async () => {
      const r = mode === 'masuk' ? await sb.auth.signInWithPassword({ email: email.trim(), password }) : await sb.auth.signUp({ email: email.trim(), password });
      if (r.error) throw new Error(r.error.message);
      if (mode === 'daftar' && !r.data.session) Alert.alert(t('prefs.auth.checkEmailTitle'), t('prefs.auth.checkEmailBody'));
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
    Alert.alert(t('prefs.shared.signOut'), t('prefs.auth.signOutBody'), [
      { text: t('prefs.shared.cancel'), style: 'cancel' },
      { text: t('prefs.auth.signOutOnly'), onPress: () => void sb.auth.signOut() },
      {
        text: t('prefs.auth.signOutWipe'),
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
        <Text variant="title">{t('prefs.auth.recoveryTitle')}</Text>
        <Text>{t('prefs.auth.recoveryBody')}</Text>
        <Card tone="accent"><Text selectable style={{ fontFamily: 'monospace', fontSize: 16 }}>{shownKey}</Text></Card>
        <Button title={t('prefs.auth.recoveryShareButton')} variant="secondary" onPress={() => Share.share({ message: t('prefs.auth.recoveryShareMessage', { key: shownKey }) })} />
        <Toggle label={t('prefs.auth.recoverySaved')} value={saved} onValueChange={setSaved} />
        <Button title={t('prefs.auth.done')} onPress={finishAfterKey} disabled={!saved} loading={busy} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Text variant="title">{mode === 'masuk' ? t('prefs.auth.signIn') : t('prefs.auth.signUp')}</Text>
        <Text muted>{t('prefs.auth.accountPurpose')}</Text>
        <Field label={t('prefs.auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label={t('prefs.auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} hint={mode === 'daftar' ? t('prefs.auth.passwordHint') : undefined} />
        <Button title={mode === 'masuk' ? t('prefs.auth.signIn') : t('prefs.auth.signUp')} onPress={submitAuth} loading={busy} disabled={!email || password.length < 8} />
        <Button title={mode === 'masuk' ? t('prefs.auth.toSignUp') : t('prefs.auth.toSignIn')} variant="ghost" onPress={() => setMode(mode === 'masuk' ? 'daftar' : 'masuk')} />
        <Text variant="small" muted>{t('prefs.auth.oauthNote')}</Text>
      </Screen>
    );
  }

  if (bindingState(settings.boundUserId, session.user.id) === 'other') {
    return (
      <Screen>
        <Text variant="title">{t('prefs.shared.differentAccount')}</Text>
        <Card tone="accent">
          <Text>{t('prefs.auth.mismatchBody')}</Text>
        </Card>
        <Button title={t('prefs.shared.wipeLocalContinue')} variant="danger" onPress={switchAccount} loading={busy} />
        <Button title={t('prefs.auth.cancelSignOut')} variant="ghost" onPress={() => sb.auth.signOut()} />
      </Screen>
    );
  }

  if (!settings.cloudEnabled) {
    return (
      <Screen>
        <Text variant="title">{t('prefs.auth.enableTitle')}</Text>
        <Card>
          <Text>{t('prefs.auth.enable1')}</Text>
          <Text>{t('prefs.auth.enable2')}</Text>
          <Text>{t('prefs.auth.enable3')}</Text>
        </Card>
        <Toggle label={t('prefs.auth.consent')} value={consent} onValueChange={setConsent} />
        <Text variant="label">{t('prefs.auth.secureBackup')}</Text>
        {useRecovery ? (
          <Field label={t('prefs.auth.recoveryKey')} value={recovery} onChangeText={setRecovery} autoCapitalize="characters" autoCorrect={false} />
        ) : (
          <Field label={t('prefs.auth.passphrase')} value={passphrase} onChangeText={setPassphrase} secureTextEntry hint={t('prefs.auth.passphraseHint')} />
        )}
        <Button title={t('prefs.auth.enable')} onPress={connect} loading={busy} disabled={!consent || (useRecovery ? recovery.length < 10 : passphrase.length < 8)} />
        <Button title={useRecovery ? t('prefs.auth.usePassphrase') : t('prefs.auth.useRecovery')} variant="ghost" onPress={() => setUseRecovery(!useRecovery)} />
        <Button title={t('prefs.shared.signOut')} variant="ghost" onPress={signOut} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title">{t('prefs.auth.activeTitle')}</Text>
      <Text muted>{session.user.email}</Text>
      <Card>
        <Text>
          {t('prefs.auth.syncStatus', {
            status:
              sync.state === 'ok'
                ? t('prefs.auth.syncLast', { time: sync.at?.slice(11, 16) ?? '' })
                : sync.state === 'error'
                  ? t('prefs.auth.syncFailed', { msg: String(sync.message) })
                  : sync.state === 'syncing'
                    ? t('prefs.auth.syncing')
                    : t('prefs.auth.syncReady'),
          })}
        </Text>
        <Button title={t('prefs.auth.syncNow')} variant="secondary" onPress={syncNow} />
      </Card>
      <Button title={t('prefs.auth.disableCloud')} variant="secondary" onPress={async () => { await updateSettings({ cloudEnabled: false }); bump(); }} />
      <Button title={t('prefs.shared.signOut')} variant="ghost" onPress={signOut} />
    </Screen>
  );
}
