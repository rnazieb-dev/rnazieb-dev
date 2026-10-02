import { usePreventScreenCapture } from 'expo-screen-capture';
import { Alert } from 'react-native';
import { Button, Card, Empty, Screen, Text } from '@/components/ui';
import { DeedItem } from '@/components/DeedItem';
import { deleteDeed, listSecretDeeds } from '@/db/repos';
import { useT } from '@/i18n/useT';
import { formatDayLong } from '@/lib/dates';
import { useApp, useDbQuery } from '@/state/app';

export default function Vault() {
  usePreventScreenCapture('vault');
  const { db, dek, unlockVault, lockVault, bump } = useApp();
  const { t } = useT();
  const q = useDbQuery((d) => listSecretDeeds(d, dek), [dek], []);
  const remove = (id: string) =>
    Alert.alert(t('journal.vault.deleteTitle'), t('journal.vault.deleteBody'), [
      { text: t('journal.common.cancel'), style: 'cancel' },
      { text: t('journal.common.delete'), style: 'destructive', onPress: async () => { await deleteDeed(db, id); bump(); } },
    ]);

  let lastDay = '';
  return (
    <Screen>
      <Text variant="title">{t('journal.vault.title')}</Text>
      <Text muted>{t('journal.vault.intro')}</Text>
      {!dek ? (
        <Card tone="secret">
          <Text>{t('journal.vault.lockedCount', { n: q.data.length })}</Text>
          <Button title={t('journal.common.open')} onPress={() => unlockVault()} />
        </Card>
      ) : (
        <Button title={t('journal.vault.lockNow')} variant="secondary" onPress={lockVault} />
      )}
      {dek && q.data.length === 0 ? <Empty title={t('journal.vault.emptyTitle')} body={t('journal.vault.emptyBody')} /> : null}
      {dek
        ? q.data.map((d) => {
            const header = d.day !== lastDay ? (lastDay = d.day) : null;
            return (
              <Card key={d.id} style={{ backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}>
                {header ? <Text variant="label" muted>{formatDayLong(header)}</Text> : null}
                <DeedItem deed={d} onDelete={() => remove(d.id)} />
              </Card>
            );
          })
        : null}
    </Screen>
  );
}
