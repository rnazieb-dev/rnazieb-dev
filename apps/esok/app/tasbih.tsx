import * as Haptics from 'expo-haptics';
import { RotateCcw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text as RNText, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Chip, Row, Screen, Text } from '@/components/ui';
import { getSetting, setSetting } from '@/db/repos';
import { useT } from '@/i18n/useT';
import { useTheme } from '@/lib/theme';
import { useApp } from '@/state/app';

const PHRASES = ['subhanallah', 'alhamdulillah', 'allahuakbar', 'lailaha', 'istighfar', 'free'] as const;
type Phrase = (typeof PHRASES)[number];
const ARABIC: Record<Phrase, string> = {
  subhanallah: 'سُبْحَانَ اللّٰهِ',
  alhamdulillah: 'الْحَمْدُ لِلّٰهِ',
  allahuakbar: 'اللّٰهُ أَكْبَرُ',
  lailaha: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
  istighfar: 'أَسْتَغْفِرُ اللّٰهَ',
  free: '',
};
const TARGETS = [33, 99, 100, 0] as const; // 0 = tanpa target

interface TasbihState {
  day: string;
  phrase: Phrase;
  target: number;
  count: number;
  rounds: number;
  total: number;
}

const SIZE = 260;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Tasbih() {
  const th = useTheme();
  const { t } = useT();
  const { db, today } = useApp();
  const [s, setS] = useState<TasbihState>({ day: today, phrase: 'subhanallah', target: 33, count: 0, rounds: 0, total: 0 });
  const [pulse] = useState(() => new Animated.Value(1));
  const [prog] = useState(() => new Animated.Value(0));

  useEffect(() => {
    void getSetting<TasbihState | null>(db, 'tasbih', null).then((v) => {
      if (v) setS(v.day === today ? v : { ...v, day: today, count: 0, rounds: 0, total: 0 });
    });
  }, [db, today]);

  useEffect(() => {
    const ratio = s.target ? s.count / s.target : (s.count % 100) / 100;
    Animated.timing(prog, { toValue: ratio, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [s.count, s.target, prog]);

  const save = (next: TasbihState) => {
    setS(next);
    void setSetting(db, 'tasbih', next);
  };

  const tap = () => {
    let { count, rounds } = s;
    count += 1;
    const finished = s.target > 0 && count >= s.target;
    if (finished) {
      count = 0;
      rounds += 1;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    pulse.setValue(0.92);
    Animated.spring(pulse, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }).start();
    save({ ...s, count, rounds, total: s.total + 1 });
  };

  const dash = prog.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });

  return (
    <Screen>
      <Text variant="title">{t('tasbih.title')}</Text>
      <Row>
        {PHRASES.map((p) => (
          <Chip key={p} label={t(`tasbih.phrases.${p}`)} selected={s.phrase === p} onPress={() => save({ ...s, phrase: p, count: 0, rounds: 0 })} />
        ))}
      </Row>
      <Pressable onPress={tap} accessibilityRole="button" accessibilityLabel={`${t('tasbih.tap')}: ${s.count}`} style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Animated.View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulse }] }}>
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={th.surfaceAlt} strokeWidth={STROKE} fill={th.surface} />
            <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={th.primary} strokeWidth={STROKE} fill="none" strokeDasharray={`${C} ${C}`} strokeDashoffset={dash} strokeLinecap="round" />
            {Array.from({ length: 33 }, (_, i) => {
              const a = (i / 33) * Math.PI * 2;
              const lit = s.target ? i < Math.round((s.count / s.target) * 33) : false;
              return <Circle key={i} cx={SIZE / 2 + Math.cos(a) * (R - 26)} cy={SIZE / 2 + Math.sin(a) * (R - 26)} r={3.2} fill={lit ? th.accent : th.border} />;
            })}
          </Svg>
          {ARABIC[s.phrase] ? <RNText style={{ fontFamily: 'Amiri_400Regular', fontSize: 26, color: th.text }}>{ARABIC[s.phrase]}</RNText> : null}
          <RNText style={{ fontSize: 64, fontWeight: '800', color: th.text, fontVariant: ['tabular-nums'] }}>{s.count}</RNText>
          <RNText style={{ color: th.muted }}>{s.target ? `/ ${s.target}` : '∞'}</RNText>
        </Animated.View>
        <Text muted style={{ marginTop: 8 }}>{t('tasbih.tap')}</Text>
      </Pressable>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text>{t('tasbih.round', { n: s.rounds })}</Text>
        <Text muted>{t('tasbih.total', { n: s.total })}</Text>
      </Row>
      <Text variant="label">{t('tasbih.target')}</Text>
      <Row>
        {TARGETS.map((n) => (
          <Chip key={n} label={n ? String(n) : '∞'} selected={s.target === n} onPress={() => save({ ...s, target: n, count: 0 })} />
        ))}
        <Pressable onPress={() => save({ ...s, count: 0, rounds: 0 })} accessibilityRole="button" accessibilityLabel={t('tasbih.reset')} style={{ padding: 10 }}>
          <RotateCcw size={22} color={th.muted} />
        </Pressable>
      </Row>
      <View style={{ height: 4 }} />
      <Text variant="small" muted>{t('tasbih.note')}</Text>
    </Screen>
  );
}
