import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Bookmark, BookmarkCheck, Share2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, Share, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Row, Text } from '@/components/ui';
import { type Verse, juzOf, markRead, surahs, toggleBookmark, versesOf } from '@/features/quran/data';
import { useQuranState } from '@/features/quran/useQuranState';
import { useT } from '@/i18n/useT';
import { radius, space, useTheme } from '@/lib/theme';

const BISMILLAH = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

export default function Reader() {
  const th = useTheme();
  const { t, lang } = useT();
  const params = useLocalSearchParams<{ surah: string; ayah?: string }>();
  const n = Math.min(114, Math.max(1, Number(params.surah) || 1));
  const meta = useMemo(() => surahs(), []);
  const counts = useMemo(() => meta.map((m) => m.count), [meta]);
  const s = meta[n - 1]!;
  const verses = useMemo(() => versesOf(n), [n]);
  const { state, save } = useQuranState();
  const [showTr, setShowTr] = useState(true);
  const [showLatin, setShowLatin] = useState(true);
  const [flash, setFlash] = useState<number | null>(null);
  const listRef = useRef<FlatList<Verse>>(null);
  const hasTranslation = lang === 'id';

  useEffect(() => {
    const a = Number(params.ayah);
    if (a > 1) setTimeout(() => listRef.current?.scrollToIndex({ index: Math.min(a, verses.length) - 1, animated: false, viewPosition: 0.1 }), 250);
  }, [params.ayah, verses.length]);

  const marked = (v: Verse) => state.last?.surah === v.surah && state.last.ayah === v.ayah;
  const isBm = (v: Verse) => state.bookmarks.some((b) => b.surah === v.surah && b.ayah === v.ayah);

  const mark = (v: Verse) => {
    save(markRead(state, counts, v.surah, v.ayah));
    setFlash(v.ayah);
    setTimeout(() => setFlash(null), 900);
    void Haptics.selectionAsync().catch(() => undefined);
  };
  const share = (v: Verse) =>
    Share.share({ message: `${v.arabic}\n\n${hasTranslation ? `${v.id}\n` : ''}— QS ${s.translit} (${v.surah}):${v.ayah}` });
  const actions = (v: Verse) => {
    const opts = [t('quran.markRead'), isBm(v) ? t('quran.unbookmark') : t('quran.bookmark'), t('quran.share')];
    const run = (i: number) => (i === 0 ? mark(v) : i === 1 ? save(toggleBookmark(state, v.surah, v.ayah, new Date().toISOString())) : share(v));
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: [...opts, '✕'], cancelButtonIndex: 3 }, (i) => i < 3 && run(i));
    else Alert.alert(`${s.translit} : ${v.ayah}`, undefined, [...opts.map((o, i) => ({ text: o, onPress: () => run(i) })), { text: '✕', style: 'cancel' as const }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: th.bg }} edges={['left', 'right']}>
      <Stack.Screen options={{ title: `${n}. ${s.translit}` }} />
      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={(v) => String(v.ayah)}
        initialNumToRender={12}
        onScrollToIndexFailed={(e) => setTimeout(() => listRef.current?.scrollToIndex({ index: e.index, animated: false }), 300)}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2, gap: space.md }}
        ListHeaderComponent={
          <View style={{ gap: space.md, alignItems: 'center', paddingBottom: space.md }}>
            <View style={{ backgroundColor: th.primary, borderRadius: radius.lg, padding: space.lg, alignSelf: 'stretch', alignItems: 'center' }}>
              <RNText style={{ fontFamily: 'Amiri_400Regular', fontSize: 34, color: th.onPrimary }}>{s.nameAr}</RNText>
              <RNText style={{ color: th.onPrimary, fontWeight: '700', fontSize: 18 }}>{s.translit}</RNText>
              <RNText style={{ color: th.onPrimary, opacity: 0.85 }}>
                {lang === 'id' ? `${s.meaning} · ` : ''}{t(s.type === 'meccan' ? 'quran.meccan' : 'quran.medinan')} · {t('quran.verses', { n: s.count })} · {t('quran.juzN', { n: juzOf(n, 1) })}
              </RNText>
            </View>
            {n !== 1 && n !== 9 ? <RNText style={{ fontFamily: 'Amiri_400Regular', fontSize: 28, color: th.text }}>{BISMILLAH}</RNText> : null}
            <Row>
              <Chip label={t('quran.translit')} selected={showLatin} onPress={() => setShowLatin(!showLatin)} />
              {hasTranslation ? <Chip label={t('quran.translation')} selected={showTr} onPress={() => setShowTr(!showTr)} /> : null}
            </Row>
            {!hasTranslation ? <Text variant="small" muted style={{ textAlign: 'center' }}>{t('quran.translationPending')}</Text> : null}
          </View>
        }
        ListFooterComponent={<Text variant="small" muted style={{ textAlign: 'center', marginTop: space.lg }}>{t('quran.sources')}</Text>}
        renderItem={({ item: v }) => (
          <Pressable
            onPress={() => mark(v)}
            onLongPress={() => actions(v)}
            accessibilityHint={t('quran.markRead')}
            style={{
              borderRadius: radius.lg, padding: space.lg, gap: space.sm,
              backgroundColor: flash === v.ayah ? th.surfaceAlt : th.surface,
              borderWidth: marked(v) ? 2 : 1, borderColor: marked(v) ? th.primary : th.border,
            }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ minWidth: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: th.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <RNText style={{ color: th.accent, fontWeight: '700', fontSize: 13 }}>{v.ayah}</RNText>
              </View>
              <Row>
                <Pressable onPress={() => save(toggleBookmark(state, v.surah, v.ayah, new Date().toISOString()))} accessibilityLabel={isBm(v) ? t('quran.unbookmark') : t('quran.bookmark')} hitSlop={8}>
                  {isBm(v) ? <BookmarkCheck size={20} color={th.primary} /> : <Bookmark size={20} color={th.muted} />}
                </Pressable>
                <Pressable onPress={() => share(v)} accessibilityLabel={t('quran.share')} hitSlop={8}>
                  <Share2 size={20} color={th.muted} />
                </Pressable>
              </Row>
            </Row>
            <RNText accessibilityLanguage="ar" style={{ fontFamily: 'Amiri_400Regular', fontSize: 28, lineHeight: 56, color: th.text, textAlign: 'right', writingDirection: 'rtl' }}>{v.arabic}</RNText>
            {showLatin ? <Text variant="small" color={th.primary} style={{ fontStyle: 'italic' }}>{v.translit}</Text> : null}
            {showTr && hasTranslation ? <Text>{v.id}</Text> : null}
            {marked(v) ? <Text variant="small" color={th.primary}>✓ {t('quran.marked')}</Text> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
