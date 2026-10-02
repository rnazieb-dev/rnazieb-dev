import { Link } from 'expo-router';
import type { Quote } from '@/content/types';
import { useT } from '@/i18n/useT';
import { TONE_KEY, gradeKey } from '@/lib/labels';
import { Arabic, Card, Pill, Row, Text } from './ui';

export function QuoteCard({ quote, compact }: { quote: Quote; compact?: boolean }) {
  const { t } = useT();
  const grade = quote.grade ? gradeKey(quote.grade) : null;
  const body = (
    <Card tone="accent">
      <Row>
        <Pill label={t(TONE_KEY[quote.tone])} tone="accent" />
        {quote.grade ? <Pill label={grade ? t(grade) : quote.grade} tone="muted" /> : null}
        {quote.kind === 'renungan' ? <Pill label={t('missions.quote.reflection')} tone="muted" /> : null}
      </Row>
      {quote.arabic && !compact ? <Arabic>{quote.arabic}</Arabic> : null}
      <Text style={{ fontSize: compact ? 16 : 17, lineHeight: 26 }}>{quote.text}</Text>
      {quote.source ? <Text variant="small" muted>{quote.source}</Text> : null}
      {quote.note ? <Text variant="small" muted>{t('missions.quote.note', { note: quote.note })}</Text> : null}
    </Card>
  );
  return compact ? (
    <Link href={{ pathname: '/quote/[id]', params: { id: quote.id } }} accessibilityRole="link">
      {body}
    </Link>
  ) : (
    body
  );
}
