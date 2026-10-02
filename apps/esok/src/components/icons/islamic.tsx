/**
 * Ilustrasi Islami buatan sendiri (SVG, viewBox 48×48, warna tunggal `color`).
 * Dirancang untuk ditaruh di atas ubin bergradien (lihat IconTile). Ikon umum lain memakai lucide-react-native.
 */
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export interface GlyphProps {
  size?: number;
  color?: string;
  /** Warna aksen sekunder (semi transparan) untuk kedalaman. */
  accent?: string;
}

type Glyph = (p: Required<GlyphProps>) => React.ReactElement;

const G_MASJID: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 7c-1.2 2.4-6.5 5-7.6 10.2h15.2C30.5 12 25.2 9.4 24 7z" fill={color} />
    <Rect x="14" y="18" width="20" height="20" rx="1.5" fill={color} />
    <Path d="M21 38v-8a3 3 0 0 1 6 0v8z" fill={accent} />
    <Rect x="7" y="16" width="4" height="22" rx="1" fill={color} />
    <Rect x="37" y="16" width="4" height="22" rx="1" fill={color} />
    <Path d="M9 10l2 5H7zM39 10l2 5h-4z" fill={color} />
    <Rect x="5" y="38" width="38" height="3" rx="1.5" fill={color} />
  </G>
);

const G_KABAH: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M10 15l14-6 14 6v20l-14 6-14-6z" fill={color} />
    <Path d="M24 21v20l14-6V15z" fill={accent} />
    <Path d="M10 19l14 6 14-6v3l-14 6-14-6z" fill="#E7C46A" />
    <Path d="M28 31.5l5-2.1v4.3l-5 2.1z" fill="#E7C46A" />
  </G>
);

const G_BULAN: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M30 8a16 16 0 1 0 10 28.6A13 13 0 1 1 30 8z" fill={color} />
    <Path d="M35 13l1.4 3.3 3.6.3-2.7 2.3.8 3.5-3.1-1.9-3.1 1.9.8-3.5-2.7-2.3 3.6-.3z" fill={accent} />
  </G>
);

const G_TASBIH: Glyph = ({ color, accent }) => {
  const beads = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
    return <Circle key={i} cx={24 + Math.cos(a) * 13} cy={21 + Math.sin(a) * 13} r={2.6} fill={i % 7 === 0 ? accent : color} />;
  });
  return (
    <G>
      {beads}
      <Path d="M24 34v5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M21 39h6l-1.5 5h-3z" fill={color} />
    </G>
  );
};

const G_QURAN: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 14c-4-3-10-3.5-15-2v22c5-1.5 11-1 15 2 4-3 10-3.5 15-2V12c-5-1.5-11-1-15 2z" fill={color} />
    <Path d="M24 14v22" stroke={accent} strokeWidth={1.6} />
    <Path d="M13 17.5c2.5-.5 5-.3 7 .6M13 22c2.5-.5 5-.3 7 .6M28 18.1c2-.9 4.5-1.1 7-.6M28 22.6c2-.9 4.5-1.1 7-.6" stroke={accent} strokeWidth={1.4} strokeLinecap="round" />
    <Path d="M12 37l12 6 12-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </G>
);

const G_LENTERA: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 4v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M18 12c0-2.2 2.7-4 6-4s6 1.8 6 4z" fill={color} />
    <Path d="M16 14h16l-2 20H18z" fill={color} />
    <Path d="M24 19c-2 3-3 5-3 7a3 3 0 0 0 6 0c0-2-1-4-3-7z" fill={accent} />
    <Path d="M17 34h14v3H17zM20 37h8l-1 4h-6z" fill={color} />
  </G>
);

const G_SAJADAH: Glyph = ({ color, accent }) => (
  <G>
    <Rect x="11" y="6" width="26" height="36" rx="2" fill={color} />
    <Path d="M16 38V18c0-3.5 3.5-6.5 8-8.5 4.5 2 8 5 8 8.5v20z" fill={accent} />
    <Path d="M11 9h26M11 39h26" stroke={accent} strokeWidth={1.4} strokeDasharray="1.5 2" />
  </G>
);

const G_KURMA: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 6c-2 6-2 10 0 14M24 20c-6-2-12 0-14 3M24 20c6-2 12 0 14 3" stroke={accent} strokeWidth={2} strokeLinecap="round" fill="none" />
    <Path d="M17 24c-3 0-5 3-5 7s2 9 5 9 4-4 4-8-1-8-4-8zM31 24c-3 0-4 4-4 8s1 8 4 8 5-5 5-9-2-7-5-7zM24 26c-3 0-4 3.5-4 7.5S21 42 24 42s4-4.5 4-8.5-1-7.5-4-7.5z" fill={color} />
  </G>
);

const G_WUDHU: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 6C19 14 14 20 14 27a10 10 0 0 0 20 0c0-7-5-13-10-21z" fill={color} />
    <Path d="M19 28a5 5 0 0 0 5 5" stroke={accent} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <Path d="M36 10c-1.5 2.5-3 4.3-3 6a3 3 0 0 0 6 0c0-1.7-1.5-3.5-3-6z" fill={color} opacity={0.75} />
  </G>
);

const G_KIBLAT: Glyph = ({ color, accent }) => (
  <G>
    <Circle cx={24} cy={24} r={17} stroke={color} strokeWidth={3} fill="none" />
    <Path d="M24 9l5 15-5 15-5-15z" fill={color} />
    <Path d="M24 9l5 15h-10z" fill={accent} />
    <Rect x="21.5" y="2" width="5" height="5" rx="1" fill={color} />
  </G>
);

const G_TUNAS: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 40V22" stroke={color} strokeWidth={3} strokeLinecap="round" />
    <Path d="M24 24c-1-7-6-11-13-11 0 7 5 11 13 11zM24 22c1-8 6-12 13-12 0 8-5 12-13 12z" fill={color} />
    <Path d="M12 41c6-3 18-3 24 0" stroke={accent} strokeWidth={3} strokeLinecap="round" fill="none" />
  </G>
);

const G_DOA: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M22 40c-5 0-9-3-10-8l-2-12c-.3-1.6 2-2.3 2.7-.8L16 27V12c0-1.6 2.5-1.6 2.5 0v11h1V9c0-1.6 2.5-1.6 2.5 0v31z" fill={color} />
    <Path d="M26 40c5 0 9-3 10-8l2-12c.3-1.6-2-2.3-2.7-.8L32 27V12c0-1.6-2.5-1.6-2.5 0v11h-1V9c0-1.6-2.5-1.6-2.5 0v31z" fill={color} />
    <Path d="M24 4l1 2.4 2.6.2-2 1.7.6 2.5L24 9.5l-2.2 1.3.6-2.5-2-1.7 2.6-.2z" fill={accent} />
  </G>
);

const G_MENARA: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 3l3 7h-6z" fill={color} />
    <Rect x="20" y="10" width="8" height="30" rx="1" fill={color} />
    <Rect x="17" y="17" width="14" height="3" rx="1.5" fill={color} />
    <Rect x="17" y="28" width="14" height="3" rx="1.5" fill={color} />
    <Path d="M22.5 22h3v4h-3zM22.5 33h3v4h-3z" fill={accent} />
    <Rect x="14" y="40" width="20" height="4" rx="1.5" fill={color} />
  </G>
);

const G_KUBAH: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 4v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M24 8c-7 4-14 9-14 17h28c0-8-7-13-14-17z" fill={color} />
    <Path d="M18 16c-2 2-3 5-3 9" stroke={accent} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <Rect x="8" y="27" width="32" height="4" rx="2" fill={color} />
    <Rect x="11" y="33" width="26" height="9" rx="1.5" fill={color} opacity={0.85} />
  </G>
);

const G_KALENDER: Glyph = ({ color, accent }) => (
  <G>
    <Rect x="8" y="10" width="32" height="30" rx="4" fill={color} />
    <Rect x="8" y="10" width="32" height="8" rx="4" fill={accent} />
    <Rect x="15" y="6" width="3.5" height="8" rx="1.7" fill={color} />
    <Rect x="29.5" y="6" width="3.5" height="8" rx="1.7" fill={color} />
    <Path d="M28 22a7 7 0 1 0 4.5 12.4A5.6 5.6 0 1 1 28 22z" fill={accent} />
  </G>
);

const G_SEDEKAH: Glyph = ({ color, accent }) => (
  <G>
    <Circle cx={24} cy={12} r={6} fill={accent} />
    <Path d="M22.5 9.5h2.4c1 0 1.6.6 1.6 1.4s-.6 1.3-1.6 1.3h-1.8c-1 0-1.6.6-1.6 1.4s.6 1.4 1.6 1.4h2.4M24 8v1.5M24 15v1.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    <Path d="M6 30l6-4c2-1.3 4-1.3 6 0l3 2h7a2.5 2.5 0 0 1 0 5h-7" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M6 40l6-3h12l12-8a2.6 2.6 0 0 1 3 4.2L26 42H6z" fill={color} />
  </G>
);

const G_JAMAAH: Glyph = ({ color, accent }) => (
  <G>
    <Circle cx={24} cy={14} r={5} fill={color} />
    <Path d="M14 38c0-6.5 4.5-11 10-11s10 4.5 10 11z" fill={color} />
    <Circle cx={11} cy={18} r={4} fill={accent} />
    <Path d="M3 36c0-5 3.6-8.5 8-8.5 1.8 0 3.3.5 4.6 1.4C13.7 31.2 13 34 13 36z" fill={accent} />
    <Circle cx={37} cy={18} r={4} fill={accent} />
    <Path d="M45 36c0-5-3.6-8.5-8-8.5-1.8 0-3.3.5-4.6 1.4 1.9 2.3 2.6 5.1 2.6 7.1z" fill={accent} />
  </G>
);

const G_WASIAT: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M12 6h18l8 8v28H12z" fill={color} />
    <Path d="M30 6v8h8z" fill={accent} />
    <Path d="M17 20h16M17 26h16M17 32h10" stroke={accent} strokeWidth={2} strokeLinecap="round" />
    <Circle cx={33} cy={36} r={4.5} fill="#E7C46A" />
  </G>
);

const G_JAM_SALAT: Glyph = ({ color, accent }) => (
  <G>
    <Circle cx={24} cy={26} r={16} fill={color} />
    <Path d="M24 15v11l7 5" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M24 2c-1 2-4 3.5-4.6 6.5h9.2C28 5.5 25 4 24 2z" fill={color} />
  </G>
);

const G_RAHASIA: Glyph = ({ color, accent }) => (
  <G>
    <Rect x="11" y="21" width="26" height="20" rx="4" fill={color} />
    <Path d="M16 21v-5a8 8 0 0 1 16 0v5" stroke={color} strokeWidth={3.4} fill="none" />
    <Path d="M24 26c-1.2 2-3 3.4-3 5.2a3 3 0 0 0 6 0c0-1.8-1.8-3.2-3-5.2z" fill={accent} />
  </G>
);

const G_MUHASABAH: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M30 6a14 14 0 1 0 12 21A11 11 0 1 1 30 6z" fill={accent} />
    <Path d="M6 40c4-6 10-9 18-9s14 3 18 9z" fill={color} />
    <Circle cx={24} cy={24} r={5} fill={color} />
  </G>
);

const G_MISI: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M12 42V8" stroke={color} strokeWidth={3} strokeLinecap="round" />
    <Path d="M13 9c6-3 11 3 17 0s7-1 7-1v16s-1-2-7 1-11-3-17 0z" fill={color} />
    <Path d="M23 13l1.3 2.7 3 .4-2.2 2 .5 3-2.6-1.4-2.6 1.4.5-3-2.2-2 3-.4z" fill={accent} />
  </G>
);

const G_BEKAL: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M14 16h20l3 26H11z" fill={color} />
    <Path d="M18 16v-3a6 6 0 0 1 12 0v3" stroke={color} strokeWidth={3} fill="none" />
    <Path d="M18 28l4 4 8-8" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </G>
);

const G_HATI: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 41S7 31 7 18.5A9.5 9.5 0 0 1 24 13a9.5 9.5 0 0 1 17 5.5C41 31 24 41 24 41z" fill={color} />
    <Path d="M15 18a4 4 0 0 1 4-4" stroke={accent} strokeWidth={2.6} strokeLinecap="round" fill="none" />
  </G>
);

const G_KETUPAT: Glyph = ({ color, accent }) => (
  <G>
    <Path d="M24 8l14 16-14 16-14-16z" fill={color} />
    <Path d="M17 16l14 16M31 16L17 32M24 8v32M10 24h28" stroke={accent} strokeWidth={1.6} />
    <Path d="M24 8c1-2 3-4 6-4" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
  </G>
);

export const ISLAMIC_GLYPHS = {
  masjid: G_MASJID,
  kabah: G_KABAH,
  bulan: G_BULAN,
  tasbih: G_TASBIH,
  quran: G_QURAN,
  lentera: G_LENTERA,
  sajadah: G_SAJADAH,
  kurma: G_KURMA,
  wudhu: G_WUDHU,
  kiblat: G_KIBLAT,
  tunas: G_TUNAS,
  doa: G_DOA,
  menara: G_MENARA,
  kubah: G_KUBAH,
  kalender: G_KALENDER,
  sedekah: G_SEDEKAH,
  jamaah: G_JAMAAH,
  wasiat: G_WASIAT,
  jamSalat: G_JAM_SALAT,
  rahasia: G_RAHASIA,
  muhasabah: G_MUHASABAH,
  misi: G_MISI,
  bekal: G_BEKAL,
  hati: G_HATI,
  ketupat: G_KETUPAT,
} as const;

export type IslamicGlyphName = keyof typeof ISLAMIC_GLYPHS;

export function IslamicGlyph({ name, size = 28, color = '#FFFFFF', accent = 'rgba(255,255,255,0.45)' }: GlyphProps & { name: IslamicGlyphName }) {
  const Draw = ISLAMIC_GLYPHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Draw size={size} color={color} accent={accent} />
    </Svg>
  );
}
