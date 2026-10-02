import { type Href, useRouter } from 'expo-router';
import { Bell, Info, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { type GradientName, IconTile, type TileIcon } from '@/components/icons/IconTile';
import { FadeIn } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import type { TKey } from '@/i18n';
import { useT } from '@/i18n/useT';
import { radius, space, useTheme } from '@/lib/theme';

interface Feature {
  key: TKey;
  icon: TileIcon;
  gradient: GradientName;
  href: Href;
}

const SECTIONS: { title: TKey; items: Feature[] }[] = [
  {
    title: 'hub.sections.salat',
    items: [
      { key: 'hub.items.prayerTimes', icon: { glyph: 'jamSalat' }, gradient: 'sunset', href: '/salat' },
      { key: 'hub.items.qibla', icon: { glyph: 'kabah' }, gradient: 'night', href: '/kiblat' },
      { key: 'hub.items.tasbih', icon: { glyph: 'tasbih' }, gradient: 'teal', href: '/tasbih' },
      { key: 'hub.items.adhan', icon: { glyph: 'menara' }, gradient: 'violet', href: '/salat' },
    ],
  },
  {
    title: 'hub.sections.dhikr',
    items: [
      { key: 'hub.items.dhikrMorning', icon: { glyph: 'tunas' }, gradient: 'sky', href: { pathname: '/adhkar', params: { tab: 'pagi' } } },
      { key: 'hub.items.dhikrEvening', icon: { glyph: 'bulan' }, gradient: 'amber', href: { pathname: '/adhkar', params: { tab: 'petang' } } },
      { key: 'hub.items.dhikrSleep', icon: { glyph: 'muhasabah' }, gradient: 'indigo', href: { pathname: '/adhkar', params: { tab: 'tidur' } } },
      { key: 'hub.items.duaDaily', icon: { glyph: 'doa' }, gradient: 'emerald', href: { pathname: '/adhkar', params: { tab: 'harian' } } },
      { key: 'hub.items.dhikrAll', icon: { glyph: 'quran' }, gradient: 'pink', href: '/dzikir' },
    ],
  },
  {
    title: 'hub.sections.deeds',
    items: [
      { key: 'hub.items.journal', icon: { glyph: 'hati' }, gradient: 'rose', href: '/(tabs)/jurnal' },
      { key: 'hub.items.missions', icon: { glyph: 'misi' }, gradient: 'emerald', href: '/(tabs)/misi' },
      { key: 'hub.items.secret', icon: { glyph: 'rahasia' }, gradient: 'indigo', href: '/vault' },
      { key: 'hub.items.provision', icon: { glyph: 'bekal' }, gradient: 'sand', href: '/bekal' },
      { key: 'hub.items.reflection', icon: { glyph: 'lentera' }, gradient: 'amber', href: { pathname: '/reflection', params: { mode: 'muhasabah' } } },
      { key: 'hub.items.ledger', icon: { glyph: 'wasiat' }, gradient: 'slate', href: '/ledger' },
    ],
  },
  {
    title: 'hub.sections.together',
    items: [{ key: 'hub.items.groups', icon: { glyph: 'jamaah' }, gradient: 'teal', href: '/(tabs)/grup' }],
  },
  {
    title: 'hub.sections.info',
    items: [
      { key: 'hub.items.hijri', icon: { glyph: 'kalender' }, gradient: 'sunset', href: '/kalender' },
      { key: 'hub.items.reminders', icon: { lucide: Bell }, gradient: 'violet', href: '/settings/reminders' },
      { key: 'hub.items.about', icon: { lucide: Info }, gradient: 'slate', href: '/settings/about' },
    ],
  },
];

export default function Ibadah() {
  const th = useTheme();
  const router = useRouter();
  const { t } = useT();
  const [q, setQ] = useState('');
  const sections = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return SECTIONS;
    return SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => t(i.key).toLowerCase().includes(needle)) })).filter((s) => s.items.length);
  }, [q, t]);

  let n = 0;
  return (
    <Screen>
      <Text variant="title">{t('hub.title')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: th.border, backgroundColor: th.surface, borderRadius: radius.md, paddingHorizontal: 14 }}>
        <Search size={20} color={th.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('hub.searchPlaceholder')}
          placeholderTextColor={th.muted}
          accessibilityLabel={t('common.search')}
          style={{ flex: 1, color: th.text, fontSize: 16, paddingVertical: 12 }}
        />
      </View>
      {sections.length === 0 ? <Text muted>{t('hub.empty', { q })}</Text> : null}
      {sections.map((s) => (
        <View key={s.title} style={{ gap: space.md }}>
          <Text variant="heading">{t(s.title)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg }}>
            {s.items.map((it) => (
              <FadeIn key={it.key} index={n++}>
                <IconTile label={t(it.key)} icon={it.icon} gradient={it.gradient} onPress={() => router.push(it.href)} />
              </FadeIn>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
