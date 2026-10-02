import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable } from 'react-native';
import { Button, Card, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { getSetting, setSetting } from '@/db/repos';
import type en from '@/i18n/locales/en/missions';
import { useT } from '@/i18n/useT';
import { useApp } from '@/state/app';

interface Item {
  id: keyof typeof en.provision.items;
  mission?: string;
}

/** "Bekal hari ini": checklist tanpa prediksi usia/ajal. Tidak ada hitung mundur. */
const ITEMS: Item[] = [
  { id: 'shalat' },
  { id: 'istighfar', mission: 'istighfar-sejenak' },
  { id: 'maaf', mission: 'maafkan-kesalahan-kecil' },
  { id: 'ortu', mission: 'kabari-orang-tua' },
  { id: 'utang', mission: 'bayar-utang-kecil' },
  { id: 'wasiat', mission: 'tulis-wasiat-catatan-utang' },
  { id: 'sedekah', mission: 'sedekah-diam-diam' },
];

export default function Bekal() {
  const router = useRouter();
  const { db, today } = useApp();
  const [checked, setChecked] = useState<string[]>([]);
  const { t } = useT();

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
      <Text variant="title">{t('missions.provision.title')}</Text>
      <Text muted>{t('missions.provision.intro')}</Text>
      {ITEMS.map((it) => (
        <Card key={it.id}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: checked.includes(it.id) }} onPress={() => toggle(it.id)}>
            <Row>
              <Text variant="heading">{checked.includes(it.id) ? '☑' : '☐'} {t(`missions.provision.items.${it.id}.title`)}</Text>
            </Row>
            <Text muted>{t(`missions.provision.items.${it.id}.hint`)}</Text>
          </Pressable>
          {it.mission ? <Button title={t('missions.provision.makeMission')} variant="secondary" onPress={() => router.push({ pathname: '/mission/[id]', params: { id: it.mission as string } })} /> : null}
        </Card>
      ))}
      <Card>
        <Text variant="heading">{t('missions.provision.ledgerTitle')}</Text>
        <Text muted>{t('missions.provision.ledgerBody')}</Text>
        <Button title={t('missions.provision.openNotes')} variant="secondary" onPress={() => router.push('/ledger')} />
        <Button title={t('missions.provision.dhikrDua')} variant="secondary" onPress={() => router.push('/adhkar')} />
      </Card>
      <SectionTitle>{t('missions.provision.hopeTitle')}</SectionTitle>
      <Card tone="accent">
        <Text>{t('missions.provision.hopeBody')}</Text>
        <Text muted>{t('missions.provision.hopeHadith')}</Text>
      </Card>
      <Card>
        <Text variant="heading">{t('missions.provision.helpTitle')}</Text>
        <Text muted>{t('missions.provision.helpBody')}</Text>
        <Button title={t('missions.provision.hotline')} variant="secondary" onPress={() => Linking.openURL('tel:119')} />
        <Button title={t('missions.provision.emergency')} variant="secondary" onPress={() => Linking.openURL('tel:112')} />
      </Card>
    </Screen>
  );
}
