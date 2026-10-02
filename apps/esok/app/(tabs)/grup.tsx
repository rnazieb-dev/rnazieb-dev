import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, Pill, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { myNudges } from '@/features/circles/api';
import { NUDGE_TEXT } from '@/features/circles/moderation';
import { useCircles } from '@/features/circles/useCircles';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';

export default function Grup() {
  const router = useRouter();
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
        <Text variant="title">Grup</Text>
        <Text muted>Berlomba dalam kebaikan bersama keluarga, sahabat, atau komunitas: misi bersama, tantangan kolektif, saling mengingatkan, dan saling mendoakan.</Text>
        <Card>
          <Text>Untuk memakai grup, selesaikan pengenalan singkat dulu (termasuk konfirmasi usia 13+).</Text>
          <Button title="Mulai pengenalan" onPress={() => router.push('/onboarding')} />
        </Card>
      </Screen>
    );
  }

  if (settings.isMinor) {
    return (
      <Screen>
        <Text variant="title">Grup</Text>
        <Card><Text>Fitur grup tersedia untuk pengguna 13 tahun ke atas. Jurnal, misi, dan pengingat tetap dapat Anda gunakan.</Text></Card>
      </Screen>
    );
  }

  if (!enabled) {
    return (
      <Screen>
        <Text variant="title">Grup</Text>
        <Text muted>Berlomba dalam kebaikan bersama keluarga, sahabat, atau komunitas: misi bersama, tantangan kolektif, saling mengingatkan, dan saling mendoakan.</Text>
        <Card>
          <Text>Grup membutuhkan akun & cloud (opsional). Catatan pribadi dan amalan rahasia tetap berfungsi tanpa akun.</Text>
          {cloudConfigured ? <Button title={session ? 'Aktifkan cloud' : 'Masuk / daftar'} onPress={() => router.push('/auth')} /> : <Text variant="small" muted>Cloud belum dikonfigurasi pada build ini.</Text>}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title">Grup</Text>
      <Row>
        <Button title="Buat grup" onPress={() => router.push('/circle/new')} />
        <Button title="Gabung dengan kode" variant="secondary" onPress={() => router.push('/circle/join')} />
      </Row>
      {pending > 0 ? <Card tone="accent"><Text>{pending} permintaan bergabung menunggu persetujuan admin.</Text></Card> : null}
      {nudges.length > 0 ? (
        <>
          <SectionTitle>Untuk Anda</SectionTitle>
          {nudges.slice(0, 3).map((n) => (
            <Card key={n.id}>
              <Text variant="label">{n.from}</Text>
              <Text>{NUDGE_TEXT[n.kind]}</Text>
            </Card>
          ))}
        </>
      ) : null}
      <SectionTitle>Grup saya</SectionTitle>
      {error ? <Text color="#B3402F" onPress={refresh}>{error} — ketuk untuk mencoba lagi</Text> : null}
      {!loading && circles.length === 0 ? <Empty title="Belum ada grup" body="Buat grup keluarga atau gabung dengan kode dari teman." /> : null}
      {circles.map(({ circle, role }) => (
        <Link key={circle.id} href={{ pathname: '/circle/[id]', params: { id: circle.id } }} asChild>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="heading">{circle.name}</Text>
              {role === 'admin' ? <Pill label="Admin" tone="accent" /> : null}
            </Row>
            <Text variant="small" muted>{circle.kind === 'keluarga' ? 'Keluarga' : circle.kind === 'sesama_jenis' ? 'Sesama jenis' : 'Terbuka'}</Text>
          </Card>
        </Link>
      ))}
    </Screen>
  );
}
