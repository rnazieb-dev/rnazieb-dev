import { useRouter } from 'expo-router';
import { Pressable, Text as RNText, View } from 'react-native';
import { ADHKAR } from '@/content';
import { FadeIn } from '@/components/motion';
import { Scene, type ScenePhase } from '@/components/Scene';
import { Screen, Text } from '@/components/ui';
import { type AdhkarTab, TABS, TAB_LABEL, itemsFor } from '@/features/adhkar/logic';
import { useT } from '@/i18n/useT';
import { radius } from '@/lib/theme';

const PHASE: Record<AdhkarTab, ScenePhase> = { pagi: 'pagi', petang: 'maghrib', tidur: 'malam', harian: 'siang', kematian: 'senja' };
const LABEL_KEY: Partial<Record<AdhkarTab, 'hub.items.dhikrMorning' | 'hub.items.dhikrEvening' | 'hub.items.dhikrSleep' | 'hub.items.duaDaily'>> = {
  pagi: 'hub.items.dhikrMorning',
  petang: 'hub.items.dhikrEvening',
  tidur: 'hub.items.dhikrSleep',
  harian: 'hub.items.duaDaily',
};

export default function Dzikir() {
  const router = useRouter();
  const { t } = useT();
  return (
    <Screen>
      <Text variant="title">{t('dhikr.title')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {TABS.map((tab, i) => {
          const key = LABEL_KEY[tab];
          return (
            <FadeIn key={tab} index={i}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/adhkar', params: { tab } })}
                style={({ pressed }) => ({ width: 168, borderRadius: radius.lg, overflow: 'hidden', transform: [{ scale: pressed ? 0.97 : 1 }] })}
              >
                <Scene phase={PHASE[tab]} height={120} birds={tab === 'petang' || tab === 'pagi'} />
                <View style={{ position: 'absolute', left: 12, bottom: 10, right: 12 }}>
                  <RNText style={{ color: '#fff', fontSize: 17, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }}>{key ? t(key) : TAB_LABEL[tab]}</RNText>
                  <RNText style={{ color: '#fff', fontSize: 13, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }}>{t('dhikr.readings', { n: itemsFor(ADHKAR, tab).length })}</RNText>
                </View>
              </Pressable>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}
