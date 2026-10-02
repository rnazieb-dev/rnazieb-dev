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
import { useT } from '@/i18n/useT';

export default function SecuritySettings() {
  const router = useRouter();
  const { db, settings, updateSettings, unlockVault, session, bump, lockVault } = useApp();
  const { t } = useT();
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
      Alert.alert(t('prefs.shared.failed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {!secured ? <Card tone="accent"><Text>{t('prefs.security.noScreenLock')}</Text></Card> : null}

      <SectionTitle>{t('prefs.security.appLockTitle')}</SectionTitle>
      <Toggle
        label={t('prefs.security.appLock')}
        hint={t('prefs.security.appLockHint')}
        value={settings.appLock}
        onValueChange={(v) => run(async () => {
          if (v && !canEnableAppLock({ secured, hasPin })) {
            return Alert.alert(t('prefs.security.setPinFirstTitle'), t('prefs.security.setPinFirstBody'));
          }
          if (v && secured && !(await authenticate(t('prefs.security.enableLockPrompt')))) return;
          await updateSettings({ appLock: v });
        })}
      />
      <Card>
        <Text variant="label">{t('prefs.security.pinTitle')} {hasPin ? t('prefs.security.pinActive') : ''}</Text>
        <Field label={t('prefs.security.newPin')} value={pin1} onChangeText={(v) => setPin1(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} />
        <Field label={t('prefs.security.repeatPin')} value={pin2} onChangeText={(v) => setPin2(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} />
        <Button
          title={hasPin ? t('prefs.security.changePin') : t('prefs.security.setPin')}
          variant="secondary"
          disabled={pin1.length !== 6 || pin1 !== pin2}
          loading={busy}
          onPress={() => run(async () => {
            await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(await createPinRecord(pin1)));
            setHasPin(true); setPin1(''); setPin2('');
            Alert.alert(t('prefs.security.pinSaved'));
          })}
        />
        {hasPin ? (
          <Button
            title={t('prefs.security.removePin')}
            variant="ghost"
            onPress={() => run(async () => {
              await SecureStore.deleteItemAsync(PIN_KEY);
              setHasPin(false);
              // Tanpa kunci layar & tanpa PIN, kunci aplikasi tak bisa dibuka → matikan.
              if (!canEnableAppLock({ secured, hasPin: false }) && settings.appLock) await updateSettings({ appLock: false });
            })}
          />
        ) : null}
        <Text variant="small" muted>{t('prefs.security.pinNote')}</Text>
      </Card>

      {session && settings.cloudEnabled ? (
        <>
          <SectionTitle>{t('prefs.security.passphraseTitle')}</SectionTitle>
          <Field label={t('prefs.security.currentPassphrase')} value={oldPass} onChangeText={setOldPass} secureTextEntry />
          <Field label={t('prefs.security.newPassphrase')} value={newPass} onChangeText={setNewPass} secureTextEntry hint={t('prefs.security.newPassphraseHint')} />
          <Button
            title={t('prefs.security.changePassphrase')}
            variant="secondary"
            disabled={oldPass.length < 8 || newPass.length < 8}
            loading={busy}
            onPress={() => run(async () => {
              const sb = getSupabase();
              const dek = await unlockVault();
              if (!sb || !dek) return;
              const env = await fetchEnvelope(sb, session.user.id);
              if (!env) throw new Error(t('prefs.security.envelopeMissing'));
              await unlockWithPassphrase(env, oldPass);
              await putEnvelope(sb, session.user.id, await rewrapPassphrase(env, dek, newPass));
              setOldPass(''); setNewPass('');
              Alert.alert(t('prefs.security.passphraseChanged'));
            })}
          />
        </>
      ) : null}

      <SectionTitle>{t('prefs.security.dataTitle')}</SectionTitle>
      <Button
        title={t('prefs.security.export')}
        variant="secondary"
        onPress={() => run(async () => {
          const dek = await unlockVault();
          if (!dek) return Alert.alert(t('prefs.security.exportNoSecretTitle'), t('prefs.security.exportNoSecretBody'), [{ text: t('prefs.shared.cancel'), style: 'cancel' }, { text: t('prefs.security.continue'), onPress: () => void shareExport(db, null) }]);
          Alert.alert(t('prefs.security.attention'), t('prefs.security.exportWarning'), [{ text: t('prefs.shared.cancel'), style: 'cancel' }, { text: t('prefs.security.exportAction'), onPress: () => void shareExport(db, dek) }]);
        })}
      />
      <Button
        title={t('prefs.security.wipeLocal')}
        variant="danger"
        onPress={() => Alert.alert(t('prefs.security.wipeLocalTitle'), t('prefs.security.wipeLocalBody'), [
          { text: t('prefs.shared.cancel'), style: 'cancel' },
          { text: t('prefs.security.delete'), style: 'destructive', onPress: () => run(async () => { await wipeLocal(db); await wipeDek(); lockVault(); await SecureStore.deleteItemAsync(PIN_KEY); await updateSettings({ onboarded: false, appLock: false, cloudEnabled: false, boundUserId: null }); bump(); router.replace('/(tabs)'); }) },
        ])}
      />
      {session ? (
        <Button
          title={t('prefs.security.deleteAccount')}
          variant="danger"
          onPress={() => Alert.alert(t('prefs.security.deleteAccountTitle'), t('prefs.security.deleteAccountBody'), [
            { text: t('prefs.shared.cancel'), style: 'cancel' },
            { text: t('prefs.security.deleteAccountAction'), style: 'destructive', onPress: () => run(async () => {
              const sb = getSupabase();
              if (!sb) return;
              await deleteMyAccount(sb);
              await sb.auth.signOut();
              await updateSettings({ cloudEnabled: false });
              Alert.alert(t('prefs.security.accountDeletedTitle'), t('prefs.security.accountDeletedBody'));
            }) },
          ])}
        />
      ) : null}
    </Screen>
  );
}
