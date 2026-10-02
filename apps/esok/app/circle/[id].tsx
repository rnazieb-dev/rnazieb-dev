import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Chip, Empty, Row, Screen, Text } from '@/components/ui';
import { ChallengeSection } from '@/features/circles/ui/ChallengeSection';
import { FeedSection } from '@/features/circles/ui/FeedSection';
import { MembersSection } from '@/features/circles/ui/MembersSection';
import { RankSection } from '@/features/circles/ui/RankSection';
import { SharedSection } from '@/features/circles/ui/SharedSection';
import { useCircles } from '@/features/circles/useCircles';
import { useT } from '@/i18n/useT';
import { useApp } from '@/state/app';

type Tab = 'feed' | 'bersama' | 'tantangan' | 'peringkat' | 'anggota';
const TABS: Tab[] = ['feed', 'bersama', 'tantangan', 'peringkat', 'anggota'];

export default function CircleScreen() {
  const router = useRouter();
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, today } = useApp();
  const { circles, refresh } = useCircles();
  const [tab, setTab] = useState<Tab>('feed');
  const entry = circles.find((c) => c.circle.id === id);
  if (!session) return <Screen><Empty title={t('groups.circle.signInToView')} /></Screen>;
  if (!entry) return <Screen><Empty title={t('groups.circle.notFound')} body={t('groups.circle.notFoundBody')} /></Screen>;
  const { circle, role } = entry;
  const isAdmin = role === 'admin';
  const uid = session.user.id;
  return (
    <Screen>
      <Text variant="title">{circle.name}</Text>
      <Text variant="small" muted>{t(circle.kind === 'keluarga' ? 'groups.kinds.keluarga' : circle.kind === 'sesama_jenis' ? 'groups.kinds.sesama_jenis' : 'groups.kinds.campur')}</Text>
      <Row>
        {TABS.map((k) => <Chip key={k} label={t(`groups.circle.tabs.${k}`)} selected={tab === k} onPress={() => setTab(k)} />)}
      </Row>
      {tab === 'feed' ? <FeedSection circle={circle} uid={uid} isAdmin={isAdmin} /> : null}
      {tab === 'bersama' ? <SharedSection circle={circle} uid={uid} today={today} /> : null}
      {tab === 'tantangan' ? <ChallengeSection circle={circle} isAdmin={isAdmin} today={today} /> : null}
      {tab === 'peringkat' ? <RankSection circle={circle} today={today} /> : null}
      {tab === 'anggota' ? <MembersSection circle={circle} uid={uid} isAdmin={isAdmin} onChanged={refresh} onLeft={() => { void refresh(); router.back(); }} /> : null}
    </Screen>
  );
}
