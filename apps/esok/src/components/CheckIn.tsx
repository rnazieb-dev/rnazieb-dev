import { Check, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Text as RNText, View } from 'react-native';
import { useT } from '@/i18n/useT';
import { type DayKey, addDays } from '@/lib/dates';
import { radius, space, useTheme } from '@/lib/theme';

/** Strip check-in 7 hari terakhir (berdasarkan hari yang ada catatan amal / hari uzur). Tanpa hadiah materi — hanya penanda. */
export function CheckIn({ today, active, uzur }: { today: DayKey; active: Set<string>; uzur: Set<string> }) {
  const th = useTheme();
  const { t } = useT();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]!;
    if (active.has(d) || uzur.has(d)) streak++;
    else if (d !== today) break;
  }
  return (
    <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: th.border }}>
      <View style={{ backgroundColor: th.primary, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: th.onPrimary, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={20} color={th.primary} strokeWidth={3} />
        </View>
        <View style={{ flex: 1 }}>
          <RNText style={{ color: th.onPrimary, fontSize: 17, fontWeight: '700' }}>{t('checkin.streak', { n: streak })}</RNText>
          <RNText style={{ color: th.onPrimary, opacity: 0.85 }}>{t('checkin.subtitle')}</RNText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: space.md, backgroundColor: th.surface }}>
        {days.map((d, i) => (
          <Dot key={d} index={i} done={active.has(d)} uzur={!active.has(d) && uzur.has(d)} last={i === 6} label={t('checkin.day', { n: i + 1 })} />
        ))}
      </View>
    </View>
  );
}

function Dot({ done, uzur, last, label, index }: { done: boolean; uzur: boolean; last: boolean; label: string; index: number }) {
  const th = useTheme();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay: index * 60, friction: 5, useNativeDriver: true }).start();
  }, [v, index]);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Animated.View
        style={{
          width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
          backgroundColor: done ? th.primary : uzur ? th.surfaceAlt : 'transparent',
          borderWidth: done ? 0 : 1.5, borderColor: th.border,
          transform: [{ scale: v }],
        }}
      >
        {done ? <Check size={18} color={th.onPrimary} strokeWidth={3} /> : last ? <Star size={18} color={th.muted} /> : uzur ? <RNText style={{ color: th.muted }}>–</RNText> : null}
      </Animated.View>
      <RNText style={{ fontSize: 11, color: th.muted }}>{label}</RNText>
    </View>
  );
}
