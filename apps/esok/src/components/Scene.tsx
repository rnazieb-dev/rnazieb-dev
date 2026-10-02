import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Suasana langit untuk tiap waktu. */
export type ScenePhase = 'subuh' | 'pagi' | 'siang' | 'asar' | 'maghrib' | 'malam' | 'senja';

interface Palette {
  sky: [string, string];
  orb: string;
  orbIsMoon: boolean;
  hills: [string, string, string];
  orbY: number; // 0..1 posisi vertikal matahari/bulan
}

const PALETTES: Record<ScenePhase, Palette> = {
  subuh: { sky: ['#1E3A8A', '#7C93D8'], orb: '#E9EEFF', orbIsMoon: true, hills: ['#3B4E9C', '#2A3A7C', '#1B2659'], orbY: 0.32 },
  pagi: { sky: ['#93C5FD', '#DBEAFE'], orb: '#FFF7D6', orbIsMoon: false, hills: ['#6C8FE0', '#4766C4', '#2C3F8F'], orbY: 0.42 },
  siang: { sky: ['#38BDF8', '#BAE6FD'], orb: '#FFFBEA', orbIsMoon: false, hills: ['#34D399', '#10B981', '#047857'], orbY: 0.22 },
  asar: { sky: ['#C9A227', '#E9C98A'], orb: '#EFE6CF', orbIsMoon: false, hills: ['#F59E0B', '#EA580C', '#B9461A'], orbY: 0.36 },
  maghrib: { sky: ['#F97316', '#FDBA74'], orb: '#FFE8C2', orbIsMoon: false, hills: ['#E2553B', '#B83A2E', '#7F1D1D'], orbY: 0.6 },
  senja: { sky: ['#F472B6', '#FBCFE8'], orb: '#FFF1F7', orbIsMoon: false, hills: ['#DB5B97', '#A8336D', '#6B1F47'], orbY: 0.55 },
  malam: { sky: ['#0B1437', '#283A75'], orb: '#F1F5FF', orbIsMoon: true, hills: ['#22306A', '#18234F', '#0E1636'], orbY: 0.28 },
};

/** Pilih suasana dari jam desimal + jadwal salat (bila ada). */
export function phaseForHour(h: number, t?: { subuh: number; terbit: number; asar: number; maghrib: number; isya: number }): ScenePhase {
  const s = t ?? { subuh: 4.5, terbit: 5.75, asar: 15, maghrib: 18, isya: 19.2 };
  if (h < s.subuh || h >= s.isya) return 'malam';
  if (h < s.terbit) return 'subuh';
  if (h < 10) return 'pagi';
  if (h < s.asar) return 'siang';
  if (h < s.maghrib - 0.4) return 'asar';
  return 'maghrib';
}

let sid = 0;

/**
 * Pemandangan bukit berlapis (SVG) dengan matahari/bulan yang bergerak pelan, awan melayang, dan burung.
 * Ringan: hanya transform berbasis native driver; berhenti bila pengguna memilih kurangi gerakan.
 */
export function Scene({ phase, height = 200, style, birds = true }: { phase: ScenePhase; height?: number; style?: ViewStyle; birds?: boolean }) {
  const p = PALETTES[phase];
  const [id] = useState(() => `s${++sid}`);
  const [width, setWidth] = useState(360);
  const [drift] = useState(() => new Animated.Value(0));
  const [bob] = useState(() => new Animated.Value(0));
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.timing(drift, { toValue: 1, duration: 26000, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [drift, bob, reduce]);

  const w = width;
  const h = height;
  const orbR = Math.min(w, h) * 0.2;
  const orbX = w * 0.74;
  const orbY = h * p.orbY;
  const cloudX = drift.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.4, w * 1.1] });
  const birdX = drift.interpolate({ inputRange: [0, 1], outputRange: [w * 0.15, -w * 0.25] });
  const orbShift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      style={[{ height, overflow: 'hidden' }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.sky[0]} />
            <Stop offset="1" stopColor={p.sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect width={w} height={h} fill={`url(#${id}sky)`} />
        {/* gelombang cahaya lembut */}
        <Path d={`M0 ${h * 0.18} C ${w * 0.3} ${h * 0.05}, ${w * 0.55} ${h * 0.32}, ${w} ${h * 0.14} L ${w} 0 L 0 0 Z`} fill="#FFFFFF" opacity={0.12} />
        <Path d={`M0 ${h * 0.42} C ${w * 0.25} ${h * 0.3}, ${w * 0.6} ${h * 0.55}, ${w} ${h * 0.36}`} stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={h * 0.08} fill="none" />
        {p.orbIsMoon
          ? Array.from({ length: 14 }, (_, i) => (
              <Circle key={i} cx={(w * ((i * 37) % 100)) / 100} cy={(h * 0.5 * ((i * 53) % 100)) / 100} r={i % 3 === 0 ? 1.6 : 1} fill="#FFFFFF" opacity={0.8} />
            ))
          : null}
      </Svg>

      <Animated.View style={{ position: 'absolute', left: orbX - orbR, top: orbY - orbR, transform: [{ translateY: orbShift }] }}>
        <Svg width={orbR * 2.6} height={orbR * 2.6} style={{ marginLeft: -orbR * 0.3, marginTop: -orbR * 0.3 }}>
          <Circle cx={orbR * 1.3} cy={orbR * 1.3} r={orbR * 1.25} fill={p.orb} opacity={0.18} />
          <Circle cx={orbR * 1.3} cy={orbR * 1.3} r={orbR} fill={p.orb} opacity={0.95} />
          {p.orbIsMoon ? <Circle cx={orbR * 1.7} cy={orbR * 1.05} r={orbR * 0.85} fill={p.sky[0]} /> : null}
        </Svg>
      </Animated.View>

      <Animated.View style={{ position: 'absolute', top: h * 0.16, transform: [{ translateX: cloudX }] }}>
        <Svg width={120} height={40}>
          <Path d="M10 32c-6 0-8-8-2-10 0-8 10-11 15-5 4-8 18-8 20 2 8-1 11 9 4 13z" fill="#FFFFFF" opacity={0.55} />
          <Path d="M70 26c-4 0-6-6-1-7 0-6 8-8 11-4 3-6 13-6 15 1 6 0 8 7 3 10z" fill="#FFFFFF" opacity={0.4} />
        </Svg>
      </Animated.View>

      {birds ? (
        <Animated.View style={{ position: 'absolute', left: w * 0.55, top: h * 0.3, transform: [{ translateX: birdX }] }}>
          <Svg width={70} height={30}>
            <Path d="M2 12q6-6 11 0q5-6 11 0" stroke="#2B1B12" strokeWidth={2} fill="none" strokeLinecap="round" />
            <Path d="M30 4q5-5 9 0q4-5 9 0" stroke="#2B1B12" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Path d="M22 24q5-5 9 0q4-5 9 0" stroke="#2B1B12" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      ) : null}

      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        <Path d={`M0 ${h * 0.62} C ${w * 0.2} ${h * 0.5}, ${w * 0.45} ${h * 0.7}, ${w * 0.7} ${h * 0.55} S ${w} ${h * 0.6}, ${w} ${h * 0.6} L ${w} ${h} L 0 ${h} Z`} fill={p.hills[0]} />
        <Path d={`M0 ${h * 0.78} C ${w * 0.3} ${h * 0.62}, ${w * 0.55} ${h * 0.82}, ${w * 0.8} ${h * 0.68} S ${w} ${h * 0.72}, ${w} ${h * 0.72} L ${w} ${h} L 0 ${h} Z`} fill={p.hills[1]} />
        <Path d={`M0 ${h * 0.9} C ${w * 0.25} ${h * 0.8}, ${w * 0.6} ${h * 0.95}, ${w} ${h * 0.84} L ${w} ${h} L 0 ${h} Z`} fill={p.hills[2]} />
        {/* siluet masjid kecil di kejauhan */}
        <Path
          d={`M${w * 0.12} ${h * 0.9} v-${h * 0.07} h${w * 0.012} v${h * 0.02} c0 -${h * 0.04} ${w * 0.05} -${h * 0.05} ${w * 0.05} 0 v-${h * 0.02} h${w * 0.012} v${h * 0.07} z`}
          fill={p.hills[2]}
          opacity={0.9}
        />
      </Svg>
    </View>
  );
}
