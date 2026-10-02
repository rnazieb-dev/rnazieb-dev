import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { quoteById } from '@/content';
import { QuoteCard } from '@/components/QuoteCard';
import { Button, Empty, Screen } from '@/components/ui';
import { useT } from '@/i18n/useT';

export default function QuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = quoteById(id);
  const { t } = useT();
  if (!q) return <Screen><Empty title={t('missions.quote.notFound')} /></Screen>;
  const share = () => Share.share({ message: `${q.arabic ? `${q.arabic}\n\n` : ''}${q.text}${q.source ? `\n— ${q.source}` : ''}\n\n${t('missions.quote.sentFrom')}` });
  return (
    <Screen>
      <QuoteCard quote={q} />
      <Button title={t('missions.quote.share')} variant="secondary" onPress={share} />
    </Screen>
  );
}
