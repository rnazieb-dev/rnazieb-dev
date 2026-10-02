import { useRouter } from 'expo-router';
import { Button, Card, Field, Pill, ProgressBar, Row, Screen, SectionTitle, Text, Toggle } from '@/components/ui';
import { BadgeGrid } from '@/components/BadgeGrid';
import { loadProgress } from '@/features/gamification/progress';
import { LEVELS } from '@/features/gamification/points';
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
      <Text variant="title">Profil</Text>
      {p && !settings.honorMode ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">Level {p.personal.level.level} · {p.personal.level.name}</Text>
            <Pill label={`${p.personal.points} poin`} tone="accent" />
          </Row>
          <ProgressBar value={p.personal.level.progress} />
          <Text variant="small" muted>Poin = penanda konsistensi, bukan nilai pahala. Pahala hanya di sisi Allah.</Text>
          {!settings.hideStreak ? <Text>Beruntun {p.personal.streak} hari · total {p.stats.deedsTotal} catatan</Text> : null}
          <Text variant="small" muted>Skor pribadi ini menyertakan amalan rahasia dan hanya terlihat oleh Anda. Yang terlihat orang lain hanya {p.publicView.points} poin dari amal yang Anda bagikan.</Text>
        </Card>
      ) : (
        <Card><Text muted>Mode ikhlas aktif: angka disembunyikan.</Text></Card>
      )}

      <Card tone="secret">
        <Text variant="heading">🔒 Amalan rahasia</Text>
        <Text muted>{p ? `${p.personal.secretCount} tersimpan` : ''} · hanya Anda yang dapat membaca.</Text>
        <Button title="Buka" variant="secondary" onPress={() => router.push('/vault')} />
      </Card>

      {!settings.honorMode ? (
        <>
          <SectionTitle>Lencana</SectionTitle>
          {p ? <BadgeGrid stats={p.stats} /> : null}
          <Text variant="small" muted>Level: {LEVELS.map((l) => l.name).join(' › ')}</Text>
        </>
      ) : null}

      <SectionTitle>Pengaturan</SectionTitle>
      <Field label="Nama tampilan" value={name} onChangeText={setName} maxLength={40} onEndEditing={saveName} onBlur={saveName} />
      <Toggle
        label="Mode ikhlas"
        hint="Sembunyikan angka poin/level/lencana milik Anda, di layar sendiri dan dari orang lain."
        value={settings.honorMode}
        onValueChange={async (v) => { await updateSettings({ honorMode: v }); await syncPrivacy({ honor_mode: v }); }}
      />
      <Toggle
        label="Ikut peringkat grup"
        hint="Dimatikan = nama Anda tidak muncul di peringkat."
        value={settings.showRankings}
        onValueChange={async (v) => { await updateSettings({ showRankings: v }); await syncPrivacy({ show_in_rankings: v }); }}
      />
      {session && settings.cloudEnabled && !settings.isMinor ? (
        <Toggle
          label="Notifikasi dari grup"
          hint="Pengingat kebaikan & doa dari anggota (maks. 3/hari per pengirim). Isi hanya nama pengirim dan teks baku."
          value={settings.pushNudges}
          onValueChange={async (v) => {
            const sb = getSupabase();
            if (!sb) return;
            try {
              if (v) await registerPush(sb);
              else await unregisterPush(sb, session.user.id);
              await updateSettings({ pushNudges: v });
            } catch (e) {
              Alert.alert('Gagal', e instanceof Error ? e.message : String(e));
            }
          }}
        />
      ) : null}
      <Toggle label="Sembunyikan rangkaian hari (streak)" value={settings.hideStreak} onValueChange={(v) => updateSettings({ hideStreak: v })} />
      <Button title="Dzikir & doa" variant="secondary" onPress={() => router.push('/adhkar')} />
      <Button title="Utang, amanah & wasiat" variant="secondary" onPress={() => router.push('/ledger')} />
      <Button title="Pengingat" variant="secondary" onPress={() => router.push('/settings/reminders')} />
      <Button title="Akun & cloud" variant="secondary" onPress={() => router.push('/auth')} />
      <Button title="Keamanan & data" variant="secondary" onPress={() => router.push('/settings/security')} />
      <Button title="Tentang & sumber konten" variant="ghost" onPress={() => router.push('/settings/about')} />
    </Screen>
  );
}
