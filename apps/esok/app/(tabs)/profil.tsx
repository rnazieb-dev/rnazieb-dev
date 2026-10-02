import { useRouter } from 'expo-router';
import { Button, Card, Field, Pill, ProgressBar, Row, Screen, SectionTitle, Text, Toggle , Chip } from '@/components/ui';
import { BadgeGrid } from '@/components/BadgeGrid';
import { CheckIn } from '@/components/CheckIn';
import { FadeIn } from '@/components/motion';
import { activityDays, uzurDays } from '@/db/repos';
import { LANGUAGES, type LangSetting } from '@/i18n';
import { useT } from '@/i18n/useT';
import { loadProgress } from '@/features/gamification/progress';
import { LEVELS } from '@/features/gamification/points';
import { levelKey } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase';
import { useApp, useDbQuery } from '@/state/app';
import { useState } from 'react';
import { sanitizeDisplayName } from '@/features/circles/moderation';
import { registerPush, unregisterPush } from '@/features/circles/push';
import { Alert } from 'react-native';

export default function Profil() {
  const router = useRouter();
  const { today, settings, updateSettings, session } = useApp();
  const { data: p } = useDbQuery((d) => loadProgress(d, today), [today], null);
  const days = useDbQuery(async (d) => ({ active: await activityDays(d, { includeSecret: true }), uzur: await uzurDays(d) }), [], { active: new Set<string>(), uzur: new Set<string>() });
  const { t } = useT();
  const [name, setName] = useState(settings.displayName);

  const saveName = async () => {
    const n = sanitizeDisplayName(name);
    await updateSettings({ displayName: n });
    const sb = getSupabase();
    if (sb && session) await sb.from('profiles').update({ display_name: n }).eq('id', session.user.id);
  };
  const syncPrivacy = async (patch: { show_in_rankings?: boolean; honor_mode?: boolean }) => {
    const sb = getSupabase();
    if (sb && session) await sb.from('profiles').update(patch).eq('id', session.user.id);
  };

  return (
    <Screen>
      <Text variant="title">{t('tabs.profile')}</Text>
      <FadeIn>
        <CheckIn today={today} active={days.data.active} uzur={days.data.uzur} />
      </FadeIn>
      {p && !settings.honorMode ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">{t('prefs.profile.level', { level: p.personal.level.level, name: (() => { const k = levelKey(p.personal.level.level); return k ? t(k) : p.personal.level.name; })() })}</Text>
            <Pill label={t('prefs.profile.points', { n: p.personal.points })} tone="accent" />
          </Row>
          <ProgressBar value={p.personal.level.progress} />
          <Text variant="small" muted>{t('prefs.profile.pointsNote')}</Text>
          {!settings.hideStreak ? <Text>{t('prefs.profile.streak', { n: p.personal.streak, total: p.stats.deedsTotal })}</Text> : null}
          <Text variant="small" muted>{t('prefs.profile.privateScore', { n: p.publicView.points })}</Text>
        </Card>
      ) : (
        <Card><Text muted>{t('prefs.profile.honorOn')}</Text></Card>
      )}

      <Card tone="secret">
        <Text variant="heading">{t('prefs.profile.secretTitle')}</Text>
        <Text muted>{p ? t('prefs.profile.secretSaved', { n: p.personal.secretCount }) : ''}{t('prefs.profile.secretOnlyYou')}</Text>
        <Button title={t('prefs.profile.open')} variant="secondary" onPress={() => router.push('/vault')} />
      </Card>

      {!settings.honorMode ? (
        <>
          <SectionTitle>{t('prefs.profile.badges')}</SectionTitle>
          {p ? <BadgeGrid stats={p.stats} /> : null}
          <Text variant="small" muted>{t('prefs.profile.levels', { list: LEVELS.map((l, i) => { const k = levelKey(i + 1); return k ? t(k) : l.name; }).join(' › ') })}</Text>
        </>
      ) : null}

      <SectionTitle>{t('prefs.profile.settingsTitle')}</SectionTitle>
      <Text variant="label">{t('settings.language')}</Text>
      <Row>
        {(['system', ...Object.keys(LANGUAGES)] as LangSetting[]).map((l) => (
          <Chip key={l} label={l === 'system' ? t('settings.system') : LANGUAGES[l as keyof typeof LANGUAGES].label} selected={settings.language === l} onPress={() => updateSettings({ language: l })} />
        ))}
      </Row>
      <Button title={t('hub.items.groups')} variant="secondary" onPress={() => router.push('/(tabs)/grup')} />
      <Field label={t('prefs.profile.displayName')} value={name} onChangeText={setName} maxLength={40} onEndEditing={saveName} onBlur={saveName} />
      <Toggle
        label={t('prefs.profile.honorMode')}
        hint={t('prefs.profile.honorModeHint')}
        value={settings.honorMode}
        onValueChange={async (v) => { await updateSettings({ honorMode: v }); await syncPrivacy({ honor_mode: v }); }}
      />
      <Toggle
        label={t('prefs.profile.rankings')}
        hint={t('prefs.profile.rankingsHint')}
        value={settings.showRankings}
        onValueChange={async (v) => { await updateSettings({ showRankings: v }); await syncPrivacy({ show_in_rankings: v }); }}
      />
      {session && settings.cloudEnabled && !settings.isMinor ? (
        <Toggle
          label={t('prefs.profile.groupNotifs')}
          hint={t('prefs.profile.groupNotifsHint')}
          value={settings.pushNudges}
          onValueChange={async (v) => {
            const sb = getSupabase();
            if (!sb) return;
            try {
              if (v) await registerPush(sb);
              else await unregisterPush(sb, session.user.id);
              await updateSettings({ pushNudges: v });
            } catch (e) {
              Alert.alert(t('prefs.shared.failed'), e instanceof Error ? e.message : String(e));
            }
          }}
        />
      ) : null}
      <Toggle label={t('prefs.profile.hideStreak')} value={settings.hideStreak} onValueChange={(v) => updateSettings({ hideStreak: v })} />
      <Button title={t('prefs.profile.adhkar')} variant="secondary" onPress={() => router.push('/adhkar')} />
      <Button title={t('prefs.profile.ledger')} variant="secondary" onPress={() => router.push('/ledger')} />
      <Button title={t('prefs.profile.reminders')} variant="secondary" onPress={() => router.push('/settings/reminders')} />
      <Button title={t('prefs.profile.account')} variant="secondary" onPress={() => router.push('/auth')} />
      <Button title={t('prefs.profile.security')} variant="secondary" onPress={() => router.push('/settings/security')} />
      <Button title={t('prefs.profile.about')} variant="ghost" onPress={() => router.push('/settings/about')} />
    </Screen>
  );
}
