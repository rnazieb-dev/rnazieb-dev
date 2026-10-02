import { Card, Empty, Row, Text } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { addDays, weekStart } from '@/lib/dates';
import { getSupabase } from '@/lib/supabase';
import { type Circle, leaderboard } from '../api';
import { useAsync } from './useAsync';

export function RankSection({ circle, today }: { circle: Circle; today: string }) {
  const sb = getSupabase()!;
  const { t } = useT();
  const since = weekStart(today);
  const rank = useAsync(() => leaderboard(sb, circle.id, since), [circle.id, since], []);
  if (!circle.rankings_enabled) return <Empty title={t('groups.rank.offTitle')} body={t('groups.rank.offBody')} />;
  return (
    <>
      <Text muted>{t('groups.rank.intro', { from: since, to: addDays(since, 6) })}</Text>
      {rank.error ? <Text color="#B3402F">{rank.error}</Text> : null}
      {!rank.loading && rank.data.length === 0 ? <Empty title={t('groups.rank.emptyTitle')} /> : null}
      {rank.data.map((r, i) => (
        <Card key={r.user_id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">{i + 1}. {r.display_name}</Text>
            <Text>{t('groups.rank.points', { n: r.points })}</Text>
          </Row>
        </Card>
      ))}
      <Text variant="small" muted>{t('groups.rank.footnote')}</Text>
    </>
  );
}
