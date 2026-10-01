import { Card, Empty, Row, Text } from '@/components/ui';
import { addDays, weekStart } from '@/lib/dates';
import { getSupabase } from '@/lib/supabase';
import { type Circle, leaderboard } from '../api';
import { useAsync } from './useAsync';

export function RankSection({ circle, today }: { circle: Circle; today: string }) {
  const sb = getSupabase()!;
  const since = weekStart(today);
  const rank = useAsync(() => leaderboard(sb, circle.id, since), [circle.id, since], []);
  if (!circle.rankings_enabled) return <Empty title="Peringkat dimatikan" body="Admin lingkaran menonaktifkan peringkat. Fokus pada kebersamaan." />;
  return (
    <>
      <Text muted>Kontribusi pekan ini ({since} s.d. {addDays(since, 6)}). Hanya 10 teratas yang ditampilkan; yang memilih menyembunyikan angka tidak ikut. Berlomba dalam kebaikan, bukan untuk dipuji.</Text>
      {rank.error ? <Text color="#B3402F">{rank.error}</Text> : null}
      {!rank.loading && rank.data.length === 0 ? <Empty title="Belum ada kontribusi pekan ini" /> : null}
      {rank.data.map((r, i) => (
        <Card key={r.user_id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">{i + 1}. {r.display_name}</Text>
            <Text>{r.points} poin</Text>
          </Row>
        </Card>
      ))}
      <Text variant="small" muted>Poin hanyalah penanda konsistensi, bukan nilai pahala. Amalan rahasia tidak pernah dihitung di sini.</Text>
    </>
  );
}
