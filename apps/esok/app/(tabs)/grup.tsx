import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, Pill, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { myNudges } from '@/features/circles/api';
import { useCircles } from '@/features/circles/useCircles';
import { useT } from '@/i18n/useT';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';

export default function Grup() {
  const router = useRouter();
  const { t } = useT();
  const { session, settings, cloudConfigured } = useApp();
  const { circles, pending, loading, error, refresh, enabled } = useCircles();
  const [nudges, setNudges] = useState<{ id: string; from: string; kind: 'ingat' | 'doa' }[]>([]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !session || !enabled) return;
    void myNudges(sb, session.user.id).then(setNudges).catch(() => undefined);
  }, [session, enabled, circles.length]);

  if (!settings.onboarded) {
    return (
      <Screen>
        <Text variant="title">{t('groups.title')}</Text>
        <Text muted>{t('groups.home.intro')}</Text>
        <Card>
          <Text>{t('groups.home.needOnboarding')}</Text>
          <Button title={t('groups.home.startOnboarding')} onPress={() => router.push('/onboarding')} />
        </Card>
      </Screen>
    );
  }

  if (settings.isMinor) {
    return (
      <Screen>
        <Text variant="title">{t('groups.title')}</Text>
        <Card><Text>{t('groups.home.minor')}</Text></Card>
      </Screen>
    );
  }

  if (!enabled) {
    return (
      <Screen>
        <Text variant="title">{t('groups.title')}</Text>
        <Text muted>{t('groups.home.intro')}</Text>
        <Card>
          <Text>{t('groups.home.needCloud')}</Text>
          {cloudConfigured ? <Button title={session ? t('groups.home.enableCloud') : t('groups.home.signIn')} onPress={() => router.push('/auth')} /> : <Text variant="small" muted>{t('groups.home.cloudNotConfigured')}</Text>}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title">{t('groups.title')}</Text>
      <Row>
        <Button title={t('groups.home.createGroup')} onPress={() => router.push('/circle/new')} />
        <Button title={t('groups.home.joinWithCode')} variant="secondary" onPress={() => router.push('/circle/join')} />
      </Row>
      {pending > 0 ? <Card tone="accent"><Text>{t('groups.home.pending', { n: pending })}</Text></Card> : null}
      {nudges.length > 0 ? (
        <>
          <SectionTitle>{t('groups.home.forYou')}</SectionTitle>
          {nudges.slice(0, 3).map((n) => (
            <Card key={n.id}>
              <Text variant="label">{n.from}</Text>
              <Text>{t(`groups.nudges.${n.kind}`)}</Text>
            </Card>
          ))}
        </>
      ) : null}
      <SectionTitle>{t('groups.home.myGroups')}</SectionTitle>
      {error ? <Text color="#B3402F" onPress={refresh}>{t('groups.home.retry', { error })}</Text> : null}
      {!loading && circles.length === 0 ? <Empty title={t('groups.home.emptyTitle')} body={t('groups.home.emptyBody')} /> : null}
      {circles.map(({ circle, role }) => (
        <Link key={circle.id} href={{ pathname: '/circle/[id]', params: { id: circle.id } }} asChild>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading">{circle.name}</Text>
              {role === 'admin' ? <Pill label={t('groups.admin')} tone="accent" /> : null}
            </Row>
            <Text variant="small" muted>{t(circle.kind === 'keluarga' ? 'groups.kinds.keluarga' : circle.kind === 'sesama_jenis' ? 'groups.kinds.sesama_jenis' : 'groups.kinds.campur')}</Text>
          </Card>
        </Link>
      ))}
    </Screen>
  );
}
