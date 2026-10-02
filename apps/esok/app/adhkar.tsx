import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ADHKAR } from '@/content';
import { Arabic, Button, Card, Chip, Pill, Row, Screen, Text } from '@/components/ui';
import { getSetting, setSetting } from '@/db/repos';
import {
  type AdhkarProgress,
  type AdhkarTab,
  TABS,
  TAB_LABEL,
  freshProgress,
  itemsFor,
  progressKey,
  suggestedTab,
  tap,
  toggleDone,
} from '@/features/adhkar/logic';
import { useApp } from '@/state/app';

const GRADE: Record<string, string> = { sahih: 'Shahih', hasan: 'Hasan', quran: "Al-Qur’an" };

export default function AdhkarScreen() {
  const { db, today } = useApp();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initial = (TABS as string[]).includes(params.tab ?? '') ? (params.tab as AdhkarTab) : suggestedTab(new Date().getHours());
  const [tab, setTab] = useState<AdhkarTab>(initial);
  const [progress, setProgress] = useState<AdhkarProgress>(freshProgress(today));

  useEffect(() => {
    void getSetting<AdhkarProgress>(db, 'adhkar:progress', freshProgress(today)).then((p) => setProgress(p.day === today ? p : freshProgress(today)));
  }, [db, today]);

  const update = (next: AdhkarProgress) => {
    setProgress(next);
    void setSetting(db, 'adhkar:progress', next);
  };

  const items = itemsFor(ADHKAR, tab);
  return (
    <Screen>
      <Text variant="title">Dzikir & doa</Text>
      <Text muted>Bersumber Al-Qur’an dan hadis shahih/hasan. Tidak ada poin atau peringkat: dzikir bukan untuk dikejar angkanya.</Text>
      <Row>
        {TABS.map((t) => <Chip key={t} label={TAB_LABEL[t]} selected={tab === t} onPress={() => setTab(t)} />)}
      </Row>
      {items.map((a) => {
        const k = progressKey(tab, a.id);
        const done = progress.done.includes(k);
        const n = progress.counts[k] ?? 0;
        return (
          <Card key={a.id} tone={done ? 'accent' : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading" style={{ flex: 1 }}>{a.title}</Text>
              <Pill label={GRADE[a.grade] ?? a.grade} tone="muted" />
            </Row>
            {a.arabic ? <Arabic>{a.arabic}</Arabic> : null}
            <Text>{a.meaning}</Text>
            <Text variant="small" muted>{a.source}</Text>
            {a.note ? <Text variant="small" muted>{a.note}</Text> : null}
            {a.kind === 'hadith' ? <Text variant="small" muted>Teks Arab: rujuk Hisnul Muslim atau kitab hadis; menunggu data terverifikasi untuk ditampilkan di sini.</Text> : null}
            {a.count ? (
              <Button title={done ? `Selesai (${a.count}×)` : `Ketuk setiap bacaan · ${n}/${a.count}`} variant={done ? 'secondary' : 'primary'} onPress={() => update(tap(progress, tab, a))} />
            ) : null}
            <Button title={done ? '✓ Sudah dibaca hari ini' : 'Tandai sudah dibaca'} variant="ghost" onPress={() => update(toggleDone(progress, tab, a))} />
          </Card>
        );
      })}
    </Screen>
  );
}
