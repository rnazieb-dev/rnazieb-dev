import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chip, Field, Row, Screen, Text } from '@/components/ui';
import { type CircleKind, createCircle } from '@/features/circles/api';
import { useT } from '@/i18n/useT';
import { getSupabase } from '@/lib/supabase';

const KINDS: CircleKind[] = ['keluarga', 'sesama_jenis', 'campur'];

export default function NewCircle() {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CircleKind>('keluarga');
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Field label={t('groups.newGroup.name')} value={name} onChangeText={setName} maxLength={60} placeholder={t('groups.newGroup.namePlaceholder')} />
      <Text variant="label">{t('groups.newGroup.kind')}</Text>
      <Row>{KINDS.map((k) => <Chip key={k} label={t(`groups.kinds.${k}`)} selected={kind === k} onPress={() => setKind(k)} />)}</Row>
      <Text variant="small" muted>{t(`groups.newGroup.hints.${kind}`)} {t('groups.newGroup.approvalNote')}</Text>
      <Button
        title={t('groups.create')}
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
            Alert.alert(t('groups.failed'), e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
