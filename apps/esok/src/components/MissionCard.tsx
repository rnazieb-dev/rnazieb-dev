import { Link } from 'expo-router';
import type { Mission } from '@/content/types';
import { useT } from '@/i18n/useT';
import { CATEGORY_KEY } from '@/lib/labels';
import { Card, Pill, Row, Text } from './ui';

export function MissionCard({ mission, done }: { mission: Mission; done?: boolean }) {
  const { t } = useT();
  return (
    <Link href={{ pathname: '/mission/[id]', params: { id: mission.id } }} asChild>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading" style={{ flex: 1 }}>{mission.title}</Text>
          {done ? <Pill label={t('missions.done')} tone="accent" /> : <Pill label={t('missions.points', { n: mission.points })} tone="muted" />}
        </Row>
        <Text muted>{mission.description}</Text>
        <Row>
          <Pill label={t(CATEGORY_KEY[mission.category])} tone="muted" />
          {mission.canBeSecret ? <Pill label={t('missions.canBeSecret')} tone="secret" /> : null}
          {mission.canBeShared ? <Pill label={t('missions.canBeShared')} tone="muted" /> : null}
          {mission.estimateMinutes > 0 ? <Pill label={t('missions.minutes', { n: mission.estimateMinutes })} tone="muted" /> : null}
        </Row>
      </Card>
    </Link>
  );
}
