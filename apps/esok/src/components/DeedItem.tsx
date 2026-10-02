import { Pressable } from 'react-native';
import type { DeedView } from '@/db/repos';
import { CATEGORY_LABEL } from '@/lib/labels';
import { Card, Pill, Row, Text } from './ui';

const VIS: Record<string, string> = { secret: 'Rahasia', circle: 'Grup', public: 'Semua teman grup' };

export function DeedItem({ deed, onDelete }: { deed: DeedView; onDelete?: () => void }) {
  return (
    <Card tone={deed.secret ? 'secret' : undefined}>
      <Row>
        <Pill label={deed.secret ? '🔒 Rahasia' : VIS[deed.visibility] ?? ''} tone={deed.secret ? 'secret' : 'muted'} />
        {deed.category ? <Pill label={CATEGORY_LABEL[deed.category]} tone="muted" /> : null}
      </Row>
      {deed.locked ? (
        <Text muted>Terkunci — buka vault untuk melihat.</Text>
      ) : (
        <>
          <Text variant="heading">{deed.title}</Text>
          {deed.note ? <Text muted>{deed.note}</Text> : null}
        </>
      )}
      {onDelete && !deed.locked ? (
        <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8}>
          <Text variant="small" muted>Hapus</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
