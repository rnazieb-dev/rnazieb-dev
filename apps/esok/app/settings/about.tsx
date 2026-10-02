import { Linking } from 'react-native';
import { Button, Card, Screen, SectionTitle, Text } from '@/components/ui';
import { MISSIONS, QUOTES } from '@/content';
import { useT } from '@/i18n/useT';

export default function About() {
  const { t } = useT();
  return (
    <Screen>
      <Text variant="title">{t('prefs.about.title')}</Text>
      <Text muted>{t('prefs.about.tagline')}</Text>

      <SectionTitle>{t('prefs.about.notesTitle')}</SectionTitle>
      <Card>
        <Text>{t('prefs.about.note1')}</Text>
        <Text>{t('prefs.about.note2')}</Text>
        <Text>{t('prefs.about.note3')}</Text>
        <Text>{t('prefs.about.note4')}</Text>
        <Text>{t('prefs.about.note5')}</Text>
      </Card>

      <SectionTitle>{t('prefs.about.sourcesTitle')}</SectionTitle>
      <Card>
        <Text>{t('prefs.about.sourcesBefore')}<Text style={{ fontWeight: '700' }}>{t('prefs.about.sourcesBold')}</Text>{t('prefs.about.sourcesAfter')}</Text>
        <Text>{t('prefs.about.font')}</Text>
        <Text variant="small" muted>{t('prefs.about.counts', { quotes: QUOTES.length, missions: MISSIONS.length })}</Text>
        <Button title="quranenc.com" variant="ghost" onPress={() => Linking.openURL('https://quranenc.com')} />
      </Card>

      <SectionTitle>{t('prefs.about.privacyTitle')}</SectionTitle>
      <Card>
        <Text>{t('prefs.about.privacy1')}</Text>
        <Text>{t('prefs.about.privacy2')}</Text>
      </Card>
    </Screen>
  );
}
