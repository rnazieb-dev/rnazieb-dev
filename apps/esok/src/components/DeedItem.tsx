import { Pressable } from 'react-native';
import type { DeedView } from '@/db/repos';
import { type TKey } from '@/i18n';
import { useT } from '@/i18n/useT';
import { Card, Pill, Row, Text } from './ui';

const VIS: Record<string, TKey> = { secret: 'journal.visibility.secret', circle: 'journal.visibility.circle', public: 'journal.visibility.public' };

export function DeedItem({ deed, onDelete }: { deed: DeedView; onDelete?: () => void }) {
  const { t } = useT();
  const vis = VIS[deed.visibility];
  return (
    <Card tone={deed.secret ? 'secret' : undefined}>
      <Row>
        <Pill label={deed.secret ? t('journal.visibility.secretLocked') : vis ? t(vis) : ''} tone={deed.secret ? 'secret' : 'muted'} />
        {deed.category ? <Pill label={t(`journal.categories.${deed.category}`)} tone="muted" /> : null}
      </Row>
      {deed.locked ? (
        <Text muted>{t('journal.deedItem.locked')}</Text>
      ) : (
        <>
          <Text variant="heading">{deed.title}</Text>
          {deed.note ? <Text muted>{deed.note}</Text> : null}
        </>
      )}
      {onDelete && !deed.locked ? (
        <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
          <Text variant="small" muted>{t('journal.deedItem.delete')}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
