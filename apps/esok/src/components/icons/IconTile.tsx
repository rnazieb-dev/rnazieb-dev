import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Animated, Pressable, Text as RNText, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/lib/theme';
import { IslamicGlyph, type IslamicGlyphName } from './islamic';

/** Pasangan gradien ubin (atas-kiri → bawah-kanan). */
export const GRADIENTS = {
  teal: ['#2DD4BF', '#0F766E'],
  emerald: ['#34D399', '#047857'],
  sky: ['#38BDF8', '#1D4ED8'],
  indigo: ['#818CF8', '#3730A3'],
  violet: ['#C084FC', '#6D28D9'],
  rose: ['#FB7185', '#BE123C'],
  sunset: ['#FDBA74', '#EA580C'],
  amber: ['#FCD34D', '#B45309'],
  night: ['#6366F1', '#1E1B4B'],
  pink: ['#F472B6', '#9D174D'],
  sand: ['#E7C46A', '#8A6A1F'],
  slate: ['#94A3B8', '#334155'],
} as const;

export type GradientName = keyof typeof GRADIENTS;

export type TileIcon = { glyph: IslamicGlyphName } | { lucide: LucideIcon };

let gid = 0;

/** Lingkaran bergradien dengan ilustrasi di tengah (gaya ikon peluncur fitur). */
export function GradientOrb({ icon, gradient = 'teal', size = 64 }: { icon: TileIcon; gradient?: GradientName; size?: number }) {
  const [id] = useState(() => `g${++gid}`);
  const [a, b] = GRADIENTS[gradient];
  const glyph = size * 0.56;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
        <Circle cx={size * 0.34} cy={size * 0.28} r={size * 0.22} fill="#FFFFFF" opacity={0.12} />
      </Svg>
      {'glyph' in icon ? (
        <IslamicGlyph name={icon.glyph} size={glyph} />
      ) : (
        <icon.lucide size={glyph * 0.8} color="#FFFFFF" strokeWidth={2.2} />
      )}
    </View>
  );
}

/** Ubin fitur: orb + label, membal sedikit saat ditekan. */
export function IconTile({
  label,
  icon,
  gradient,
  onPress,
  badge,
  size = 64,
}: {
  label: string;
  icon: TileIcon;
  gradient?: GradientName;
  onPress?: () => void;
  badge?: string;
  size?: number;
}) {
  const t = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 5, tension: 200 }).start();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => to(0.9)}
      onPressOut={() => to(1)}
      style={{ width: size + 28, alignItems: 'center', gap: 6 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <GradientOrb icon={icon} gradient={gradient} size={size} />
        {badge ? (
          <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: t.accent, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
            <RNText style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</RNText>
          </View>
        ) : null}
      </Animated.View>
      <RNText numberOfLines={2} style={{ color: t.text, fontSize: 12.5, textAlign: 'center', lineHeight: 16 }}>{label}</RNText>
    </Pressable>
  );
}
