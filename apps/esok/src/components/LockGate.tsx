import * as SecureStore from 'expo-secure-store';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { type PinRecord, backoffSeconds, lockUsable, verifyPin } from '@/features/security/lock';
import { authenticate, authAvailability } from '@/features/security/vault';
import { useApp } from '@/state/app';
import { useT } from '@/i18n/useT';
import { Button, Field, Text } from './ui';
import { space, useTheme } from '@/lib/theme';

export const PIN_KEY = 'esok.pin.v1';
const FAIL_KEY = 'esok.pin.fail.v1';

interface FailState {
  count: number;
  until: number;
}

async function readFails(): Promise<FailState> {
  try {
    const raw = await SecureStore.getItemAsync(FAIL_KEY);
    return raw ? (JSON.parse(raw) as FailState) : { count: 0, until: 0 };
  } catch {
    return { count: 0, until: 0 };
  }
}

/** Kunci aplikasi: biometrik/kode sandi perangkat, atau PIN 6 digit dengan jeda bertahap. */
export function LockGate({ children }: { children: ReactNode }) {
  const { appLocked, setAppLocked, settings, updateSettings } = useApp();
  const t = useTheme();
  const { t: tr } = useT();
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [secured, setSecured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(PIN_KEY).then((v) => setHasPin(!!v));
    void authAvailability().then((a) => setSecured(a.secured));
  }, [appLocked]);

  // Fail-safe: bila tak ada cara membuka (tanpa kunci layar & tanpa PIN), jangan kunci pengguna permanen.
  useEffect(() => {
    if (!appLocked || !settings.appLock || hasPin === null || secured === null) return;
    if (!lockUsable({ secured, hasPin })) {
      setAppLocked(false);
      void updateSettings({ appLock: false });
    }
  }, [appLocked, settings.appLock, hasPin, secured, setAppLocked, updateSettings]);

  const tryBiometric = useCallback(async () => {
    const { secured } = await authAvailability();
    if (!secured) return;
    if (await authenticate(tr('prefs.lock.unlockPrompt'))) setAppLocked(false);
  }, [setAppLocked, tr]);

  useEffect(() => {
    if (appLocked && settings.appLock) void tryBiometric();
  }, [appLocked, settings.appLock, tryBiometric]);

  const submit = async () => {
    setBusy(true);
    try {
      const fails = await readFails();
      const wait = Math.ceil((fails.until - Date.now()) / 1000);
      if (wait > 0) return setMsg(tr('prefs.lock.tooMany', { s: wait }));
      const raw = await SecureStore.getItemAsync(PIN_KEY);
      if (!raw) return setAppLocked(false);
      if (await verifyPin(pin, JSON.parse(raw) as PinRecord)) {
        await SecureStore.deleteItemAsync(FAIL_KEY);
        setPin('');
        setMsg('');
        setAppLocked(false);
      } else {
        const count = fails.count + 1;
        await SecureStore.setItemAsync(FAIL_KEY, JSON.stringify({ count, until: Date.now() + backoffSeconds(count) * 1000 }));
        setMsg(tr('prefs.lock.wrongPin'));
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!appLocked || !settings.appLock) return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: space.xl, gap: space.lg }}>
      <Text variant="title">{tr('prefs.lock.title')}</Text>
      <Text muted>{hasPin ? tr('prefs.lock.hintPin') : tr('prefs.lock.hint')}</Text>
      <Button title={tr('prefs.lock.biometric')} onPress={tryBiometric} />
      {hasPin ? (
        <>
          <Field label={tr('prefs.lock.pinLabel')} value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} />
          <Button title={tr('prefs.lock.pin')} variant="secondary" onPress={submit} loading={busy} disabled={pin.length !== 6} />
        </>
      ) : null}
      {msg ? <Text color={t.danger}>{msg}</Text> : null}
    </View>
  );
}
