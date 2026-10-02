import { usePreventScreenCapture } from 'expo-screen-capture';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Field, Screen, Text } from '@/components/ui';
import { EMPTY_REFLECTION, type Reflection, getReflection, saveReflection } from '@/db/repos';
import { useT } from '@/i18n/useT';
import { useApp } from '@/state/app';

export default function ReflectionScreen() {
  usePreventScreenCapture('reflection');
  const router = useRouter();
  const { t } = useT();
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
      if (!key) return Alert.alert(t('journal.common.locked'), t('journal.reflection.lockedBody'));
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
        <Text muted>{t('journal.reflection.privateNote')}</Text>
        <Button title={t('journal.common.unlockBiometric')} onPress={async () => { const k = await unlockVault(); if (k) { setR(await getReflection(db, k, today)); setReady(true); } }} />
      </Screen>
    );
  }

  return (
    <Screen>
      {mode !== 'muhasabah' ? (
        <>
          <Text variant="title">{t('journal.reflection.niyyahTitle')}</Text>
          <Card>
            <Text muted>{t('journal.reflection.niyyahQuote')}</Text>
          </Card>
          <Field label={t('journal.reflection.niyyahLabel')} value={r.niat} onChangeText={(v) => setR({ ...r, niat: v })} multiline maxLength={800} />
        </>
      ) : (
        <>
          <Text variant="title">{t('journal.reflection.muhasabahTitle')}</Text>
          <Card>
            <Text muted>{t('journal.reflection.muhasabahQuote')}</Text>
          </Card>
          <Field label={t('journal.reflection.gratitudeLabel')} value={r.syukur} onChangeText={(v) => setR({ ...r, syukur: v })} multiline maxLength={800} />
          <Field label={t('journal.reflection.regretLabel')} value={r.penyesalan} onChangeText={(v) => setR({ ...r, penyesalan: v })} multiline maxLength={800} hint={t('journal.reflection.regretHint')} />
          <Field label={t('journal.reflection.resolveLabel')} value={r.tekad} onChangeText={(v) => setR({ ...r, tekad: v })} multiline maxLength={800} />
        </>
      )}
      <Button title={t('journal.common.save')} onPress={save} loading={busy} />
    </Screen>
  );
}
