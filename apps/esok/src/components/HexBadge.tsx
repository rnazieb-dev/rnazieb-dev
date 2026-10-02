import { useState } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { GRADIENTS, type GradientName } from './icons/IconTile';
import { IslamicGlyph, type IslamicGlyphName } from './icons/islamic';

let hid = 0;

/** Lencana heksagon berlapis (gaya permata) dengan ilustrasi di tengah. Abu-abu bila belum diraih. */
export function HexBadge({ glyph, gradient, size = 72, earned }: { glyph: IslamicGlyphName; gradient: GradientName; size?: number; earned: boolean }) {
  const [id] = useState(() => `h${++hid}`);
  const [a, b] = earned ? GRADIENTS[gradient] : (['#CBD5E1', '#94A3B8'] as const);
  const s = size;
  const hex = `M${s / 2} 2 L${s - 6} ${s * 0.27} L${s - 6} ${s * 0.73} L${s / 2} ${s - 2} L6 ${s * 0.73} L6 ${s * 0.27} Z`;
  const inner = `M${s / 2} ${s * 0.14} L${s * 0.84} ${s * 0.33} L${s * 0.84} ${s * 0.67} L${s / 2} ${s * 0.86} L${s * 0.16} ${s * 0.67} L${s * 0.16} ${s * 0.33} Z`;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center', opacity: earned ? 1 : 0.6 }}>
      <Svg width={s} height={s} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Path d={hex} fill={`url(#${id})`} />
        <Path d={inner} fill="#000" opacity={0.12} />
        <Path d={`M${s / 2} 2 L${s - 6} ${s * 0.27} L${s / 2} ${s * 0.5} L6 ${s * 0.27} Z`} fill="#fff" opacity={0.14} />
        {earned ? <Path d={`M${s * 0.78} ${s * 0.16} l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z`} fill="#fff" opacity={0.85} /> : null}
      </Svg>
      <IslamicGlyph name={glyph} size={s * 0.46} />
    </View>
  );
}
