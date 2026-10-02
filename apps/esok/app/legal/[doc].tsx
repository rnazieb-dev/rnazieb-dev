import { Stack, useLocalSearchParams } from 'expo-router';
import { Text as RNText, View } from 'react-native';
import legalData from '@/content/legal.generated.json';
import { Card, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { space, useTheme } from '@/lib/theme';

interface Block {
  t: 'p' | 'h2' | 'li' | 'q';
  text: string;
}
type Doc = { title: string; blocks: Block[] };
const data = legalData as unknown as Record<'en' | 'id', Record<'privacy' | 'terms', Doc>> & { meta: { effectiveDate: string } };

/** **tebal** sederhana. */
function Rich({ text, color, size = 16 }: { text: string; color: string; size?: number }) {
  const parts = text.split(/(\*\*.+?\*\*)/g).filter(Boolean);
  return (
    <RNText style={{ color, fontSize: size, lineHeight: size * 1.5 }}>
      {parts.map((p, i) => (p.startsWith('**') ? <RNText key={i} style={{ fontWeight: '700' }}>{p.slice(2, -2)}</RNText> : p))}
    </RNText>
  );
}

export default function LegalDoc() {
  const th = useTheme();
  const { t, lang } = useT();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const key = doc === 'terms' ? 'terms' : 'privacy';
  const content = data[lang === 'id' ? 'id' : 'en'][key];
  const translated = lang !== 'en' && lang !== 'id';
  return (
    <Screen>
      <Stack.Screen options={{ title: key === 'terms' ? t('legal.terms') : t('legal.privacy') }} />
      <Text variant="title">{content.title}</Text>
      <Text variant="small" muted>{t('legal.updated', { date: data.meta.effectiveDate })}</Text>
      {translated ? (
        <Card tone="accent">
          <Text variant="small">{t('legal.languageNote')}</Text>
        </Card>
      ) : null}
      <View style={{ gap: space.md }}>
        {content.blocks.map((b, i) =>
          b.t === 'h2' ? (
            <Text key={i} variant="heading" style={{ marginTop: space.md }}>{b.text}</Text>
          ) : b.t === 'li' ? (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
              <RNText style={{ color: th.accent }}>•</RNText>
              <View style={{ flex: 1 }}><Rich text={b.text} color={th.text} /></View>
            </View>
          ) : b.t === 'q' ? (
            <Card key={i}><Rich text={b.text} color={th.muted} size={14} /></Card>
          ) : (
            <Rich key={i} text={b.text} color={th.text} />
          ),
        )}
      </View>
    </Screen>
  );
}
