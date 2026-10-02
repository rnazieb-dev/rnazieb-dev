import { useRouter } from 'expo-router';
import { useState } from 'react';
import { QUOTES } from '@/content';
import { Button, Card, Chip, Field, Row, Screen, Text, Toggle } from '@/components/ui';
import { QuoteCard } from '@/components/QuoteCard';
import { requestNotificationPermission } from '@/features/reminders/notifications';
import type { Intensity } from '@/features/reminders/schedule';
import { sanitizeDisplayName } from '@/features/circles/moderation';
import { useApp } from '@/state/app';
import { useT } from '@/i18n/useT';

const STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { settings, updateSettings } = useApp();
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [agree, setAgree] = useState(false);
  const [adult, setAdult] = useState(false);
  const [name, setName] = useState(settings.displayName === 'Hamba Allah' ? '' : settings.displayName);
  const [remind, setRemind] = useState(true);
  const [intensity, setIntensity] = useState<Intensity>('sedang');
  const [allowKhauf, setAllowKhauf] = useState(true);
  const [busy, setBusy] = useState(false);
  const intro = QUOTES.find((q) => q.id === 'h-ahmad-bibit-kurma')!;

  const finish = async () => {
    setBusy(true);
    try {
      if (remind) await requestNotificationPermission();
      await updateSettings({
        onboarded: true,
        displayName: sanitizeDisplayName(name),
        isMinor: !adult,
        reminders: { ...settings.reminders, enabled: remind, intensity, allowKhauf },
      });
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="small" muted>{t('prefs.onboarding.step', { n: step + 1, total: STEPS })}</Text>
        <Button title={t('prefs.onboarding.later')} variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      </Row>
      {step === 0 ? (
        <>
          <Text variant="title">{t('prefs.onboarding.introTitle')}</Text>
          <Text>{t('prefs.onboarding.introBody')}</Text>
          <QuoteCard quote={intro} />
          <Button title={t('prefs.shared.continue')} onPress={() => setStep(1)} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Text variant="title">{t('prefs.onboarding.adabTitle')}</Text>
          <Card>
            <Text>{t('prefs.onboarding.adab1Before')}<Text style={{ fontWeight: '700' }}>{t('prefs.onboarding.adab1Bold')}</Text>{t('prefs.onboarding.adab1After')}</Text>
            <Text>{t('prefs.onboarding.adab2Before')}<Text style={{ fontWeight: '700' }}>{t('prefs.onboarding.adab2Bold')}</Text>{t('prefs.onboarding.adab2After')}</Text>
            <Text>{t('prefs.onboarding.adab3')}</Text>
            <Text>{t('prefs.onboarding.adab4')}</Text>
          </Card>
          <Toggle label={t('prefs.onboarding.understand')} value={agree} onValueChange={setAgree} />
          <Row>
            <Button title={t('legal.terms')} variant="ghost" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} />
            <Button title={t('legal.privacy')} variant="ghost" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })} />
          </Row>
          <Row>
            <Button title={t('prefs.shared.back')} variant="ghost" onPress={() => setStep(0)} />
            <Button title={t('prefs.shared.continue')} onPress={() => setStep(2)} disabled={!agree} />
          </Row>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Text variant="title">{t('prefs.onboarding.aboutTitle')}</Text>
          <Field label={t('prefs.onboarding.nameLabel')} value={name} onChangeText={setName} placeholder={t('prefs.onboarding.namePlaceholder')} maxLength={40} hint={t('prefs.onboarding.nameHint')} />
          <Toggle label={t('prefs.onboarding.adult')} value={adult} onValueChange={setAdult} hint={t('prefs.onboarding.adultHint')} />
          <Row>
            <Button title={t('prefs.shared.back')} variant="ghost" onPress={() => setStep(1)} />
            <Button title={t('prefs.shared.continue')} onPress={() => setStep(3)} />
          </Row>
          {!adult ? <Text variant="small" muted>{t('prefs.onboarding.minorNote')}</Text> : null}
        </>
      ) : null}
      {step === 3 ? (
        <>
          <Text variant="title">{t('prefs.onboarding.remindersTitle')}</Text>
          <Toggle label={t('prefs.onboarding.enableDaily')} value={remind} onValueChange={setRemind} hint={t('prefs.shared.localNotifHint')} />
          {remind ? (
            <>
              <Text variant="label">{t('prefs.shared.howOften')}</Text>
              <Row>
                {(['ringan', 'sedang', 'sering'] as Intensity[]).map((i) => (
                  <Chip key={i} label={t('prefs.shared.perDay', { n: i === 'ringan' ? 1 : i === 'sedang' ? 2 : 3 })} selected={intensity === i} onPress={() => setIntensity(i)} />
                ))}
              </Row>
              <Toggle label={t('prefs.onboarding.includeKhauf')} value={allowKhauf} onValueChange={setAllowKhauf} hint={t('prefs.onboarding.includeKhaufHint')} />
            </>
          ) : null}
          <Row>
            <Button title={t('prefs.shared.back')} variant="ghost" onPress={() => setStep(2)} />
            <Button title={t('prefs.onboarding.start')} onPress={finish} loading={busy} />
          </Row>
        </>
      ) : null}
    </Screen>
  );
}
