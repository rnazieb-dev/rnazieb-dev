import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark, ChevronRight, Clock, Search, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text as RNText, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, ProgressBar, Row, Text } from '@/components/ui';
import { JUZ_START, TOTAL_VERSES, filterSurahs, juzOf, surahs } from '@/features/quran/data';
import { useQuranState } from '@/features/quran/useQuranState';
import { useT } from '@/i18n/useT';
import { radius, space, useTheme } from '@/lib/theme';

type Tab = 'surah' | 'juz' | 'bookmark';

export default function QuranHome() {
  const th = useTheme();
  const router = useRouter();
  const { t } = useT();
  const list = useMemo(() => surahs(), []);
  const { state, reload } = useQuranState();
  // Muat ulang status saat kembali dari pembaca.
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('surah');
  const shown = useMemo(() => filterSurahs(list, q), [list, q]);
  const pct = Math.round((state.khatamFurthest / TOTAL_VERSES) * 1000) / 10;
  const open = (surah: number, ayah?: number) => router.push({ pathname: '/quran/[surah]', params: { surah: String(surah), ...(ayah ? { ayah: String(ayah) } : {}) } });

  const header = (
    <View style={{ gap: space.md, paddingBottom: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: th.border, backgroundColor: th.surface, borderRadius: radius.md, paddingHorizontal: 14 }}>
        <Search size={20} color={th.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder={t('quran.search')} placeholderTextColor={th.muted} style={{ flex: 1, color: th.text, fontSize: 16, paddingVertical: 12 }} />
      </View>
      <Pressable
        onPress={() => (state.last ? open(state.last.surah, state.last.ayah) : open(1))}
        style={({ pressed }) => ({ backgroundColor: th.primary, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: pressed ? 0.9 : 1 })}
      >
        <Clock size={26} color={th.onPrimary} />
        <View style={{ flex: 1 }}>
          <RNText style={{ color: th.onPrimary, fontSize: 18, fontWeight: '700' }}>{t('quran.lastRead')}</RNText>
          <RNText style={{ color: th.onPrimary, opacity: 0.9 }}>
            {state.last ? `${list[state.last.surah - 1]?.translit} : ${state.last.ayah}` : t('quran.noLastRead')}
          </RNText>
        </View>
        <ChevronRight color={th.onPrimary} />
      </Pressable>
      <View style={{ borderWidth: 1, borderColor: th.border, backgroundColor: th.surface, borderRadius: radius.lg, padding: space.lg, gap: 8 }}>
        <Row>
          <Sparkles size={20} color={th.accent} />
          <Text variant="heading">{t('quran.khatam')}</Text>
        </Row>
        <ProgressBar value={state.khatamFurthest / TOTAL_VERSES} color={th.accent} />
        <Text variant="small" muted>{t('quran.khatamNote', { r: state.khatamRound + 1, p: pct })}</Text>
      </View>
      <Row>
        <Chip label={t('quran.surahs')} selected={tab === 'surah'} onPress={() => setTab('surah')} />
        <Chip label={t('quran.juz')} selected={tab === 'juz'} onPress={() => setTab('juz')} />
        <Chip label={`${t('quran.bookmarks')} (${state.bookmarks.length})`} selected={tab === 'bookmark'} onPress={() => setTab('bookmark')} />
      </Row>
    </View>
  );

  const row = (key: string, badge: string, title: string, sub: string, right: string | null, onPress: () => void) => (
    <Pressable key={key} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: th.border, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: th.surfaceAlt, transform: [{ rotate: '45deg' }] }}>
        <RNText style={{ color: th.primary, fontWeight: '700', transform: [{ rotate: '-45deg' }] }}>{badge}</RNText>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700' }}>{title}</Text>
        <Text variant="small" muted>{sub}</Text>
      </View>
      {right ? <RNText style={{ fontFamily: 'Amiri_400Regular', fontSize: 22, color: th.primary }}>{right}</RNText> : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }} edges={['left', 'right']}>
      {tab === 'surah' ? (
        <FlatList
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2 }}
          ListHeaderComponent={header}
          data={shown}
          keyExtractor={(s) => String(s.number)}
          initialNumToRender={20}
          renderItem={({ item: s }) => row(String(s.number), String(s.number), s.translit, `${s.meaning} · ${t(s.type === 'meccan' ? 'quran.meccan' : 'quran.medinan')} · ${t('quran.verses', { n: s.count })}`, s.nameAr, () => open(s.number))}
        />
      ) : tab === 'juz' ? (
        <FlatList
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2 }}
          ListHeaderComponent={header}
          data={JUZ_START.map((p, i) => ({ n: i + 1, s: p[0], a: p[1] }))}
          keyExtractor={(j) => String(j.n)}
          renderItem={({ item: j }) => row(`j${j.n}`, String(j.n), t('quran.juzN', { n: j.n }), `${list[j.s - 1]?.translit} : ${j.a}`, null, () => open(j.s, j.a))}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2 }}
          ListHeaderComponent={header}
          data={state.bookmarks}
          keyExtractor={(b) => `${b.surah}:${b.ayah}`}
          ListEmptyComponent={<Row><Bookmark size={18} color={th.muted} /><Text muted style={{ flex: 1 }}>{t('quran.noBookmarks')}</Text></Row>}
          renderItem={({ item: b }) => row(`${b.surah}:${b.ayah}`, String(b.surah), `${list[b.surah - 1]?.translit} : ${b.ayah}`, t('quran.juzN', { n: juzOf(b.surah, b.ayah) }), list[b.surah - 1]?.nameAr ?? null, () => open(b.surah, b.ayah))}
        />
      )}
    </SafeAreaView>
  );
}
