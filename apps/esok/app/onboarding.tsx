import { useRouter } from 'expo-router';
import { useState } from 'react';
import { QUOTES } from '@/content';
import { Button, Card, Chip, Field, Row, Screen, Text, Toggle } from '@/components/ui';
import { QuoteCard } from '@/components/QuoteCard';
import { requestNotificationPermission } from '@/features/reminders/notifications';
import type { Intensity } from '@/features/reminders/schedule';
import { sanitizeDisplayName } from '@/features/circles/moderation';
import { useApp } from '@/state/app';

const STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { settings, updateSettings } = useApp();
  const [step, setStep] = useState(0);
  const [agree, setAgree] = useState(false);
  const [adult, setAdult] = useState(false);
  const [name, setName] = useState(settings.displayName === 'Hamba Allah' ? '' : settings.displayName);
  const [remind, setRemind] = useState(true);
  const [intensity, setIntensity] = useState<Intensity>('sedang');
  const [allowKhauf, setAllowKhauf] = useState(true);
  const [busy, setBusy] = useState(false);
  const intro = QUOTES.find((q) => q.id === 'h-ahmad-bibit-kurma')!;

  const finish = async () => {
    setBusy(true);
    try {
      if (remind) await requestNotificationPermission();
      await updateSettings({
        onboarded: true,
        displayName: sanitizeDisplayName(name),
        isMinor: !adult,
        reminders: { ...settings.reminders, enabled: remind, intensity, allowKhauf },
      });
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="small" muted>Langkah {step + 1} dari {STEPS}</Text>
        <Button title="Nanti saja" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      </Row>
      {step === 0 ? (
        <>
          <Text variant="title">Hari ini seakan esok tiada</Text>
          <Text>
            Esok membantu Anda mengingat kematian dengan tenang, lalu mengisi hari ini dengan kebaikan: mencatat amal, menjalankan misi kecil,
            dan saling mengajak keluarga serta sahabat untuk berlomba dalam kebaikan.
          </Text>
          <QuoteCard quote={intro} />
          <Button title="Lanjut" onPress={() => setStep(1)} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Text variant="title">Beberapa adab</Text>
          <Card>
            <Text>• Niat karena Allah. Poin dan lencana hanya penanda konsistensi, <Text style={{ fontWeight: '700' }}>bukan nilai pahala</Text>; pahala hanya di sisi Allah.</Text>
            <Text>• Amalan <Text style={{ fontWeight: '700' }}>rahasia</Text> adalah bawaan: terenkripsi, tidak masuk feed atau peringkat, dan tak pernah tampil ke siapa pun.</Text>
            <Text>• Kita mengingat kematian agar beramal, bukan mengharapkannya. Rahmat Allah luas; jangan putus asa.</Text>
            <Text>• Esok bukan pengganti ilmu. Untuk urusan hukum agama, rujuklah ulama/ustadz terpercaya.</Text>
          </Card>
          <Toggle label="Saya memahami hal di atas" value={agree} onValueChange={setAgree} />
          <Row>
            <Button title="Kembali" variant="ghost" onPress={() => setStep(0)} />
            <Button title="Lanjut" onPress={() => setStep(2)} disabled={!agree} />
          </Row>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Text variant="title">Tentang Anda</Text>
          <Field label="Nama tampilan (untuk grup)" value={name} onChangeText={setName} placeholder="Hamba Allah" maxLength={40} hint="Boleh nama panggilan atau samaran. Anda bisa mengubahnya kapan saja." />
          <Toggle label="Saya berusia 13 tahun ke atas" value={adult} onValueChange={setAdult} hint="Anak di bawah 13 tahun dapat memakai fitur pribadi dengan pendampingan orang tua, tanpa grup." />
          <Row>
            <Button title="Kembali" variant="ghost" onPress={() => setStep(1)} />
            <Button title="Lanjut" onPress={() => setStep(3)} />
          </Row>
          {!adult ? <Text variant="small" muted>Tanpa konfirmasi usia 13+, fitur grup & cloud dinonaktifkan. Jurnal, misi, dan pengingat tetap dapat dipakai.</Text> : null}
        </>
      ) : null}
      {step === 3 ? (
        <>
          <Text variant="title">Pengingat</Text>
          <Toggle label="Aktifkan pengingat harian" value={remind} onValueChange={setRemind} hint="Notifikasi lokal; tidak butuh internet." />
          {remind ? (
            <>
              <Text variant="label">Seberapa sering?</Text>
              <Row>
                {(['ringan', 'sedang', 'sering'] as Intensity[]).map((i) => (
                  <Chip key={i} label={i === 'ringan' ? '1×/hari' : i === 'sedang' ? '2×/hari' : '3×/hari'} selected={intensity === i} onPress={() => setIntensity(i)} />
                ))}
              </Row>
              <Toggle label="Sertakan pengingat bernada peringatan" value={allowKhauf} onValueChange={setAllowKhauf} hint="Dimatikan = hanya harapan & ajakan beramal. Nada peringatan tidak pernah berturut-turut." />
            </>
          ) : null}
          <Row>
            <Button title="Kembali" variant="ghost" onPress={() => setStep(2)} />
            <Button title="Mulai" onPress={finish} loading={busy} />
          </Row>
        </>
      ) : null}
    </Screen>
  );
}
