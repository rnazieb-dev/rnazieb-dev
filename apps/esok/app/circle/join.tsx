import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Field, Screen, Text } from '@/components/ui';
import { joinCircle } from '@/features/circles/api';
import { useT } from '@/i18n/useT';
import { getSupabase } from '@/lib/supabase';

export default function JoinCircle() {
  const router = useRouter();
  const { t } = useT();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Text muted>{t('groups.join.intro')}</Text>
      <Field label={t('groups.join.code')} value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={10} />
      <Button
        title={t('groups.join.submit')}
        loading={busy}
        disabled={code.trim().length < 6}
        onPress={async () => {
          const sb = getSupabase();
          if (!sb) return;
          setBusy(true);
          try {
            await joinCircle(sb, code);
            Alert.alert(t('groups.sent'), t('groups.join.awaiting'));
            router.back();
          } catch (e) {
            Alert.alert(t('groups.failed'), e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
