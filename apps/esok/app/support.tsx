import { Heart } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { FadeIn } from '@/components/motion';
import { Button, Card, Row, Screen, Text } from '@/components/ui';
import legalData from '@/content/legal.generated.json';
import { useT } from '@/i18n/useT';
import { space, useTheme } from '@/lib/theme';

/** Tautan dukungan: EXPO_PUBLIC_DONATE_URL (build) atau donateUrl di docs/legal/config.json. Kosong → tombol disembunyikan. */
const DONATE_URL: string = process.env.EXPO_PUBLIC_DONATE_URL || (legalData as { meta: { donateUrl: string } }).meta.donateUrl || '';

export default function Support() {
  const th = useTheme();
  const { t } = useT();
  return (
    <Screen>
      <FadeIn>
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: th.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={34} color={th.onPrimary} />
          </View>
          <Text variant="title" style={{ textAlign: 'center' }}>{t('support.title')}</Text>
        </View>
      </FadeIn>
      <FadeIn index={1}><Text>{t('support.lead')}</Text></FadeIn>
      <FadeIn index={2}>
        <Card tone="accent">
          <Text variant="heading">{t('support.principles')}</Text>
          {(['p1', 'p2', 'p3', 'p4'] as const).map((k) => (
            <Row key={k} style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <Text color={th.accent}>•</Text>
              <Text style={{ flex: 1 }}>{t(`support.${k}`)}</Text>
            </Row>
          ))}
        </Card>
      </FadeIn>
      <FadeIn index={3}>
        <Card>
          <Text variant="heading">{t('support.usage')}</Text>
          <Text muted>{t('support.usageBody')}</Text>
        </Card>
      </FadeIn>
      <FadeIn index={4}>
        {DONATE_URL ? (
          <View style={{ gap: space.sm }}>
            <Button title={t('support.cta')} onPress={() => Linking.openURL(DONATE_URL)} />
            <Text variant="small" muted style={{ textAlign: 'center' }}>{t('support.storeNote')}</Text>
          </View>
        ) : (
          <Card><Text muted>{t('support.unavailable')}</Text></Card>
        )}
      </FadeIn>
      <Text variant="small" muted style={{ textAlign: 'center' }}>{t('support.thanks')}</Text>
    </Screen>
  );
}
