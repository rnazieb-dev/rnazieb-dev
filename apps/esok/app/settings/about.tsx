import { Linking } from 'react-native';
import { Button, Card, Screen, SectionTitle, Text } from '@/components/ui';
import { MISSIONS, QUOTES } from '@/content';

export default function About() {
  return (
    <Screen>
      <Text variant="title">Tentang Esok</Text>
      <Text muted>Pengingat kematian & jurnal kebaikan: “hari ini seakan esok tiada”.</Text>

      <SectionTitle>Catatan penting</SectionTitle>
      <Card>
        <Text>• Esok bukan sumber hukum agama dan tidak menggantikan ulama/ustadz. Untuk masalah fikih, rujuklah ahlinya.</Text>
        <Text>• Setiap kutipan mencantumkan sumber dan derajat (shahih/hasan). Hadis lemah/palsu tidak dipakai. Kutipan tetap perlu ditinjau berkala oleh pihak berilmu.</Text>
        <Text>• Poin, level, dan lencana hanyalah penanda konsistensi, bukan nilai pahala. Esok tidak menghitung pahala.</Text>
        <Text>• Penanggalan Hijriah dan waktu salat di aplikasi berupa perkiraan perhitungan; ikuti penetapan resmi setempat.</Text>
        <Text>• Esok tidak memproses uang. Untuk zakat/sedekah, salurkan langsung atau lewat lembaga resmi (mis. BAZNAS/LAZ resmi).</Text>
      </Card>

      <SectionTitle>Sumber & atribusi</SectionTitle>
      <Card>
        <Text>Teks Al-Qur’an (Utsmani) dan terjemah Indonesia (Kementerian Agama RI) diambil dari data terbuka <Text style={{ fontWeight: '700' }}>quran-json</Text> yang bersumber dari The Noble Qur’an Encyclopedia (quranenc.com), lisensi CC BY-SA 4.0.</Text>
        <Text>Font Arab: Amiri (SIL Open Font License).</Text>
        <Text variant="small" muted>{QUOTES.length} kutipan · {MISSIONS.length} misi.</Text>
        <Button title="quranenc.com" variant="ghost" onPress={() => Linking.openURL('https://quranenc.com')} />
      </Card>

      <SectionTitle>Privasi</SectionTitle>
      <Card>
        <Text>Amalan rahasia & refleksi dienkripsi di perangkat sebelum disinkronkan (E2EE). Server tidak dapat membacanya, dan tidak ada fitur sosial yang menyentuhnya.</Text>
        <Text>Anda dapat mengekspor dan menghapus seluruh data kapan saja di Profil › Keamanan & data.</Text>
      </Card>
    </Screen>
  );
}
