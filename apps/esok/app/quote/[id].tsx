import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { quoteById } from '@/content';
import { QuoteCard } from '@/components/QuoteCard';
import { Button, Empty, Screen } from '@/components/ui';

export default function QuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = quoteById(id);
  if (!q) return <Screen><Empty title="Kutipan tidak ditemukan" /></Screen>;
  const share = () => Share.share({ message: `${q.arabic ? `${q.arabic}\n\n` : ''}${q.text}${q.source ? `\n— ${q.source}` : ''}\n\n(Dikirim dari Esok)` });
  return (
    <Screen>
      <QuoteCard quote={q} />
      <Button title="Bagikan" variant="secondary" onPress={share} />
    </Screen>
  );
}
