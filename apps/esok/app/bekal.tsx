import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable } from 'react-native';
import { Button, Card, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { getSetting, setSetting } from '@/db/repos';
import { useApp } from '@/state/app';

interface Item {
  id: string;
  title: string;
  hint: string;
  mission?: string;
}

/** "Bekal hari ini": checklist tanpa prediksi usia/ajal. Tidak ada hitung mundur. */
const ITEMS: Item[] = [
  { id: 'shalat', title: 'Shalat tepat waktu', hint: 'Jaga yang wajib terlebih dahulu.' },
  { id: 'istighfar', title: 'Istighfar & taubat', hint: 'Mohon ampun atas kekurangan hari ini.', mission: 'istighfar-sejenak' },
  { id: 'maaf', title: 'Minta maaf atau maafkan seseorang', hint: 'Lapangkan dada; selesaikan yang tertunda.', mission: 'maafkan-kesalahan-kecil' },
  { id: 'ortu', title: 'Kabari orang tua / keluarga', hint: 'Silaturahmi tidak perlu menunggu waktu luang.', mission: 'kabari-orang-tua' },
  { id: 'utang', title: 'Tunaikan atau catat utang', hint: 'Jiwa seorang mukmin tergantung pada utangnya hingga dilunasi (HR. Tirmidzi no. 1078).', mission: 'bayar-utang-kecil' },
  { id: 'wasiat', title: 'Tulis wasiat / catatan amanah', hint: 'Wasiat yang tertulis (HR. Bukhari no. 2738 & Muslim no. 1627).', mission: 'tulis-wasiat-catatan-utang' },
  { id: 'sedekah', title: 'Bersedekah, sekecil apa pun', hint: 'Jagalah diri dari api neraka walau dengan separuh kurma (HR. Bukhari no. 1417 & Muslim no. 1016).', mission: 'sedekah-diam-diam' },
];

export default function Bekal() {
  const router = useRouter();
  const { db, today } = useApp();
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    void getSetting<{ day: string; checked: string[] }>(db, 'bekal', { day: '', checked: [] }).then((s) => setChecked(s.day === today ? s.checked : []));
  }, [db, today]);

  const toggle = async (id: string) => {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    setChecked(next);
    await setSetting(db, 'bekal', { day: today, checked: next });
  };

  return (
    <Screen>
      <Text variant="title">Bekal hari ini</Text>
      <Text muted>Tidak ada yang tahu kapan ajalnya, maka perbaiki hari ini. Bukan untuk menakuti, tetapi untuk menenangkan hati.</Text>
      {ITEMS.map((it) => (
        <Card key={it.id}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: checked.includes(it.id) }} onPress={() => toggle(it.id)}>
            <Row>
              <Text variant="heading">{checked.includes(it.id) ? '☑' : '☐'} {it.title}</Text>
            </Row>
            <Text muted>{it.hint}</Text>
          </Pressable>
          {it.mission ? <Button title="Jadikan misi" variant="secondary" onPress={() => router.push({ pathname: '/mission/[id]', params: { id: it.mission as string } })} /> : null}
        </Card>
      ))}
      <SectionTitle>Menjaga harapan</SectionTitle>
      <Card tone="accent">
        <Text>Kita tidak mengharapkan kematian; kita berbaik sangka kepada Allah dan beramal selagi diberi waktu.</Text>
        <Text muted>“Janganlah salah seorang di antara kalian meninggal kecuali dalam keadaan berbaik sangka kepada Allah.” — HR. Muslim no. 2877</Text>
      </Card>
      <Card>
        <Text variant="heading">Butuh bantuan?</Text>
        <Text muted>Jika Anda merasa sangat tertekan atau terlintas keinginan mengakhiri hidup, Anda tidak sendirian. Hubungi orang terdekat atau tenaga profesional, dan layanan berikut:</Text>
        <Button title="Layanan Kemenkes 119 ext. 8" variant="secondary" onPress={() => Linking.openURL('tel:119')} />
        <Button title="Darurat 112" variant="secondary" onPress={() => Linking.openURL('tel:112')} />
      </Card>
    </Screen>
  );
}
