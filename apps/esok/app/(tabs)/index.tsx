import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View , ScrollView } from 'react-native';
import { QUOTES } from '@/content';
import { Button, Card, Pill, ProgressBar, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { QuoteCard } from '@/components/QuoteCard';
import { FadeIn, SproutHero } from '@/components/motion';
import { IconTile } from '@/components/icons/IconTile';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { useT } from '@/i18n/useT';
import { markQuoteSeen, missionRows } from '@/db/repos';
import { loadProgress } from '@/features/gamification/progress';
import { dueCounts } from '@/features/ledger/repo';
import { suggestedTab } from '@/features/adhkar/logic';
import { ensureAssignments } from '@/features/missions/service';
import { quoteOfDay } from '@/features/reminders/daily';
import { NAMA_BULAN_HIJRI, gregorianToHijri } from '@/lib/hijri';
import { formatDayLong, fromDayKey } from '@/lib/dates';
import { levelKey } from '@/lib/labels';
import { useApp, useDbQuery } from '@/state/app';

export default function Beranda() {
  const router = useRouter();
  const { db, today, settings, updateSettings, bump } = useApp();
  const { t } = useT();
  const levelName = (n: number, fallback: string) => { const k = levelKey(n); return k ? t(k) : fallback; };
  const quote = useMemo(() => quoteOfDay(QUOTES, today, settings.seed, settings.reminders.allowKhauf), [today, settings.seed, settings.reminders.allowKhauf]);
  const h = gregorianToHijri(fromDayKey(today));

  useEffect(() => {
    void markQuoteSeen(db, quote.id);
  }, [db, quote.id]);

  const progress = useDbQuery((d) => loadProgress(d, today), [today], null);
  const due = useDbQuery((d) => dueCounts(d, today, 7), [today], { overdue: 0, soon: 0 });
  const missions = useDbQuery(
    async (d) => {
      const level = (await loadProgress(d, today)).personal.level.level;
      const t = await ensureAssignments(d, today, settings.seed, level);
      const rows = await missionRows(d, [today]);
      return { daily: t.daily, done: new Set(rows.filter((r) => r.status === 'done').map((r) => r.mission_id)) };
    },
    [today, settings.seed],
    { daily: [], done: new Set<string>() },
  );

  const p = progress.data;
  const hide = settings.honorMode;
  const doneCount = missions.data.daily.filter((m) => missions.data.done.has(m.id)).length;

  return (
    <Screen>
      <FadeIn>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <SproutHero />
          <Text variant="title" style={{ textAlign: 'center' }}>{settings.displayName !== 'Hamba Allah' ? t('missions.home.greetingName', { name: settings.displayName }) : t('missions.home.greeting')}</Text>
          <Text variant="small" muted style={{ textAlign: 'center' }}>{formatDayLong(today)} · {t('missions.home.hijri', { day: h.day, month: NAMA_BULAN_HIJRI[h.month - 1] ?? '', year: h.year })}</Text>
        </View>
      </FadeIn>
      {!settings.onboarded && !settings.introDismissed ? (
        <FadeIn index={1}>
          <Card tone="accent">
            <Text variant="heading">{t('missions.home.newTitle')}</Text>
            <Text muted>{t('missions.home.newBody')}</Text>
            <Row>
              <Button title={t('missions.home.startIntro')} onPress={() => router.push('/onboarding')} />
              <Button title={t('missions.home.notNow')} variant="ghost" onPress={() => updateSettings({ introDismissed: true })} />
            </Row>
          </Card>
        </FadeIn>
      ) : null}
      <FadeIn index={2}>
        <NextPrayerCard />
      </FadeIn>
      <FadeIn index={3}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          <IconTile size={56} label={t('hub.items.quran')} icon={{ glyph: 'quran' }} gradient="amber" onPress={() => router.push('/quran')} />
          <IconTile size={56} label={t('hub.items.qibla')} icon={{ glyph: 'kabah' }} gradient="night" onPress={() => router.push('/kiblat')} />
          <IconTile size={56} label={t('hub.items.tasbih')} icon={{ glyph: 'tasbih' }} gradient="teal" onPress={() => router.push('/tasbih')} />
          <IconTile size={56} label={t('hub.items.dhikrAll')} icon={{ glyph: 'quran' }} gradient="pink" onPress={() => router.push('/dzikir')} />
          <IconTile size={56} label={t('hub.items.hijri')} icon={{ glyph: 'kalender' }} gradient="sunset" onPress={() => router.push('/kalender')} />
          <IconTile size={56} label={t('hub.items.provision')} icon={{ glyph: 'bekal' }} gradient="sand" onPress={() => router.push('/bekal')} />
          <IconTile size={56} label={t('hub.items.secret')} icon={{ glyph: 'rahasia' }} gradient="indigo" onPress={() => router.push('/vault')} />
        </ScrollView>
      </FadeIn>
      <FadeIn index={4}>
        <QuoteCard quote={quote} />
      </FadeIn>
      <FadeIn index={5}>
        <Row>
          <Button title={t('hub.items.provision')} variant="secondary" onPress={() => router.push('/bekal')} />
          <Button title={suggestedTab(new Date().getHours()) === 'pagi' ? t('hub.items.dhikrMorning') : t('hub.items.dhikrEvening')} variant="secondary" onPress={() => router.push('/adhkar')} />
        </Row>
      </FadeIn>
      {due.data.overdue + due.data.soon > 0 ? (
        <Card tone="accent">
          <Text variant="heading">{t('missions.home.dueTitle')}</Text>
          <Text muted>
            {due.data.overdue > 0 ? t('missions.home.dueOverdue', { n: due.data.overdue }) : ''}
            {due.data.overdue > 0 && due.data.soon > 0 ? ' · ' : ''}
            {due.data.soon > 0 ? t('missions.home.dueSoon', { n: due.data.soon }) : ''}{t('missions.home.dueTail')}
          </Text>
          <Button title={t('missions.home.openNotes')} variant="secondary" onPress={() => router.push('/ledger')} />
        </Card>
      ) : null}

      <FadeIn index={6}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="heading">{t('missions.home.today')}</Text>
          {p && !hide ? <Pill label={t('missions.home.levelPill', { n: p.personal.level.level, name: levelName(p.personal.level.level, p.personal.level.name) })} tone="accent" /> : null}
        </Row>
        {p && !hide ? (
          <>
            <ProgressBar value={p.personal.level.progress} />
            <Text muted>
              {t('missions.home.consistencyPoints', { n: p.personal.points })}{!settings.hideStreak ? t('missions.home.streak', { n: p.personal.streak }) : ''}
            </Text>
            {p.personal.secretCount > 0 ? <Text variant="small" color="#7a78c8">{t('missions.home.secretCount', { n: p.personal.secretCount })}</Text> : null}
            {!p.personal.activeToday ? <Text variant="small" muted>{t('missions.home.noneToday')}</Text> : <Text variant="small" muted>{t('missions.home.someToday')}</Text>}
          </>
        ) : (
          <Text muted>{hide ? t('missions.home.honorMode') : t('missions.loading')}</Text>
        )}
        <Button title={t('missions.home.logDeed')} onPress={() => router.push('/deed/new')} />
        <Row>
          <Button title={t('missions.home.morningIntention')} variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'niat' } })} />
          <Button title={t('missions.home.eveningReflection')} variant="secondary" onPress={() => router.push({ pathname: '/reflection', params: { mode: 'muhasabah' } })} />
        </Row>
      </Card>
      </FadeIn>

      <SectionTitle>{t('missions.home.todayMissions', { done: doneCount, total: missions.data.daily.length })}</SectionTitle>
      {missions.data.daily.map((m, i) => (
        <FadeIn key={m.id} index={7 + i}>
        <Link href={{ pathname: '/mission/[id]', params: { id: m.id } }} asChild>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading" style={{ flex: 1 }}>{m.title}</Text>
              {missions.data.done.has(m.id) ? <Pill label={t('missions.done')} tone="accent" /> : <Pill label={t('missions.points', { n: m.points })} tone="muted" />}
            </Row>
            <Text muted>{m.description}</Text>
          </Card>
        </Link>
        </FadeIn>
      ))}
      <Button title={t('missions.home.seeAll')} variant="ghost" onPress={() => router.push('/(tabs)/misi')} />
      {progress.error || missions.error ? <Text color="#B3402F" onPress={bump}>{t('missions.home.loadError')}</Text> : null}
      <Text variant="small" muted style={{ textAlign: 'center' }}>
        {t('missions.home.footer')}
      </Text>
    </Screen>
  );
}
