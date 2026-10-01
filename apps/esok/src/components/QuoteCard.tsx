import { Link } from 'expo-router';
import type { Quote } from '@/content/types';
import { TONE_LABEL } from '@/lib/labels';
import { Arabic, Card, Pill, Row, Text } from './ui';

const GRADE_LABEL: Record<string, string> = { sahih: 'Shahih', hasan: 'Hasan', quran: "Al-Qur'an" };

export function QuoteCard({ quote, compact }: { quote: Quote; compact?: boolean }) {
  const body = (
    <Card tone="accent">
      <Row>
        <Pill label={TONE_LABEL[quote.tone]} tone="accent" />
        {quote.grade ? <Pill label={GRADE_LABEL[quote.grade] ?? quote.grade} tone="muted" /> : null}
        {quote.kind === 'renungan' ? <Pill label="Renungan Esok" tone="muted" /> : null}
      </Row>
      {quote.arabic && !compact ? <Arabic>{quote.arabic}</Arabic> : null}
      <Text style={{ fontSize: compact ? 16 : 17, lineHeight: 26 }}>{quote.text}</Text>
      {quote.source ? <Text variant="small" muted>{quote.source}</Text> : null}
      {quote.note ? <Text variant="small" muted>Catatan: {quote.note}</Text> : null}
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
