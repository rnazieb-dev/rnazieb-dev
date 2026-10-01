import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Chip, Empty, Row, Screen, Text } from '@/components/ui';
import { ChallengeSection } from '@/features/circles/ui/ChallengeSection';
import { FeedSection } from '@/features/circles/ui/FeedSection';
import { MembersSection } from '@/features/circles/ui/MembersSection';
import { RankSection } from '@/features/circles/ui/RankSection';
import { SharedSection } from '@/features/circles/ui/SharedSection';
import { useCircles } from '@/features/circles/useCircles';
import { useApp } from '@/state/app';

type Tab = 'feed' | 'bersama' | 'tantangan' | 'peringkat' | 'anggota';
const TABS: { key: Tab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'bersama', label: 'Misi bersama' },
  { key: 'tantangan', label: 'Tantangan' },
  { key: 'peringkat', label: 'Peringkat' },
  { key: 'anggota', label: 'Anggota' },
];

export default function CircleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, today } = useApp();
  const { circles, refresh } = useCircles();
  const [tab, setTab] = useState<Tab>('feed');
  const entry = circles.find((c) => c.circle.id === id);
  if (!session) return <Screen><Empty title="Masuk untuk melihat lingkaran" /></Screen>;
  if (!entry) return <Screen><Empty title="Lingkaran tidak ditemukan" body="Anda mungkin belum disetujui admin atau telah keluar." /></Screen>;
  const { circle, role } = entry;
  const isAdmin = role === 'admin';
  const uid = session.user.id;
  return (
    <Screen>
      <Text variant="title">{circle.name}</Text>
      <Text variant="small" muted>{circle.kind === 'keluarga' ? 'Keluarga' : circle.kind === 'sesama_jenis' ? 'Sesama jenis' : 'Terbuka'}</Text>
      <Row>
        {TABS.map((t) => <Chip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />)}
      </Row>
      {tab === 'feed' ? <FeedSection circle={circle} uid={uid} isAdmin={isAdmin} /> : null}
      {tab === 'bersama' ? <SharedSection circle={circle} uid={uid} today={today} /> : null}
      {tab === 'tantangan' ? <ChallengeSection circle={circle} isAdmin={isAdmin} today={today} /> : null}
      {tab === 'peringkat' ? <RankSection circle={circle} today={today} /> : null}
      {tab === 'anggota' ? <MembersSection circle={circle} uid={uid} isAdmin={isAdmin} onChanged={refresh} onLeft={() => { void refresh(); router.back(); }} /> : null}
    </Screen>
  );
}
