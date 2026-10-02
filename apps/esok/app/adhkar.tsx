import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ADHKAR } from '@/content';
import { Arabic, Button, Card, Chip, Pill, Row, Screen, Text } from '@/components/ui';
import { getSetting, setSetting } from '@/db/repos';
import {
  type AdhkarProgress,
  type AdhkarTab,
  TABS,
  freshProgress,
  itemsFor,
  progressKey,
  suggestedTab,
  tap,
  toggleDone,
} from '@/features/adhkar/logic';
import { useT } from '@/i18n/useT';
import { gradeKey } from '@/lib/labels';
import { useApp } from '@/state/app';

export default function AdhkarScreen() {
  const { db, today } = useApp();
  const { t: tr } = useT();
  const gradeLabel = (g: string) => { const k = gradeKey(g); return k ? tr(k) : g; };
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
      <Text variant="title">{tr('missions.adhkar.title')}</Text>
      <Text muted>{tr('missions.adhkar.intro')}</Text>
      <Row>
        {TABS.map((t) => <Chip key={t} label={tr(`missions.adhkar.tabs.${t}`)} selected={tab === t} onPress={() => setTab(t)} />)}
      </Row>
      {items.map((a) => {
        const k = progressKey(tab, a.id);
        const done = progress.done.includes(k);
        const n = progress.counts[k] ?? 0;
        return (
          <Card key={a.id} tone={done ? 'accent' : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading" style={{ flex: 1 }}>{a.title}</Text>
              <Pill label={gradeLabel(a.grade)} tone="muted" />
            </Row>
            {a.arabic ? <Arabic>{a.arabic}</Arabic> : null}
            <Text>{a.meaning}</Text>
            <Text variant="small" muted>{a.source}</Text>
            {a.note ? <Text variant="small" muted>{a.note}</Text> : null}
            {a.kind === 'hadith' ? <Text variant="small" muted>{tr('missions.adhkar.arabicPending')}</Text> : null}
            {a.count ? (
              <Button title={done ? tr('missions.adhkar.doneCount', { n: a.count }) : tr('missions.adhkar.tapCount', { n, total: a.count })} variant={done ? 'secondary' : 'primary'} onPress={() => update(tap(progress, tab, a))} />
            ) : null}
            <Button title={done ? tr('missions.adhkar.readToday') : tr('missions.adhkar.markRead')} variant="ghost" onPress={() => update(toggleDone(progress, tab, a))} />
          </Card>
        );
      })}
    </Screen>
  );
}
