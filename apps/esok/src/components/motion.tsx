import { type ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, View } from 'react-native';
import { useTheme } from '@/lib/theme';

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => undefined);
  }, []);
  return reduce;
}

/** Muncul perlahan dari bawah; `index` memberi jeda bertahap antarbagian. */
export function FadeIn({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay: 70 * index, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, index]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

const sprout = require('../../assets/splash-icon.png') as number;

/** Tunas Esok: tumbuh saat layar dibuka, lalu "bernapas" pelan dengan cahaya lembut. */
export function SproutHero({ size = 88 }: { size?: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const grow = useState(() => new Animated.Value(0))[0];
  const breath = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.spring(grow, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start();
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [grow, breath, reduce]);
  const scale = Animated.multiply(grow, breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }));
  const glow = breath.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });
  const sway = breath.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  return (
    <View style={{ width: size * 1.5, height: size * 1.5, alignItems: 'center', justifyContent: 'center' }} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ position: 'absolute', width: size * 1.45, height: size * 1.45, borderRadius: size, backgroundColor: t.accent, opacity: glow, transform: [{ scale }] }} />
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#123A39', alignItems: 'center', justifyContent: 'center', transform: [{ scale }, { rotate: sway }] }}>
        <Image source={sprout} style={{ width: size * 0.9, height: size * 0.9 }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}
