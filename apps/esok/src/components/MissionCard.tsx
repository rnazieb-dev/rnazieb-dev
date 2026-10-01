import { Link } from 'expo-router';
import type { Mission } from '@/content/types';
import { CATEGORY_LABEL } from '@/lib/labels';
import { Card, Pill, Row, Text } from './ui';

export function MissionCard({ mission, done }: { mission: Mission; done?: boolean }) {
  return (
    <Link href={{ pathname: '/mission/[id]', params: { id: mission.id } }} asChild>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading" style={{ flex: 1 }}>{mission.title}</Text>
          {done ? <Pill label="Selesai" tone="accent" /> : <Pill label={`${mission.points} poin`} tone="muted" />}
        </Row>
        <Text muted>{mission.description}</Text>
        <Row>
          <Pill label={CATEGORY_LABEL[mission.category]} tone="muted" />
          {mission.canBeSecret ? <Pill label="Bisa rahasia" tone="secret" /> : null}
          {mission.canBeShared ? <Pill label="Bisa bersama" tone="muted" /> : null}
          {mission.estimateMinutes > 0 ? <Pill label={`${mission.estimateMinutes} mnt`} tone="muted" /> : null}
        </Row>
      </Card>
    </Link>
  );
}
