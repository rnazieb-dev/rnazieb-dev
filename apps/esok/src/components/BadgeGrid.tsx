import { useEffect, useState } from 'react';
import { Animated, Pressable, Text as RNText, View } from 'react-native';
import { type BadgeDef, type BadgeTrack, type Stats, badgeTracks } from '@/features/gamification/badges';
import { useT } from '@/i18n/useT';
import { badgeKeys } from '@/lib/labels';
import { radius, space, useTheme } from '@/lib/theme';
import { HexBadge } from './HexBadge';
import type { GradientName } from './icons/IconTile';
import type { IslamicGlyphName } from './icons/islamic';
import { Card, ProgressBar, Text } from './ui';

const LOOK: Record<string, { glyph: IslamicGlyphName; gradient: GradientName }> = {
  catatan: { glyph: 'tunas', gradient: 'emerald' },
  hari: { glyph: 'kalender', gradient: 'sunset' },
  beruntun: { glyph: 'lentera', gradient: 'amber' },
  keluarga: { glyph: 'kubah', gradient: 'rose' },
  sedekah: { glyph: 'sedekah', gradient: 'sand' },
  ilmu: { glyph: 'quran', gradient: 'sky' },
  memaafkan: { glyph: 'hati', gradient: 'pink' },
  lingkungan: { glyph: 'kurma', gradient: 'teal' },
  misi: { glyph: 'misi', gradient: 'violet' },
  bersama: { glyph: 'jamaah', gradient: 'indigo' },
  grup: { glyph: 'jamaah', gradient: 'teal' },
  tantangan: { glyph: 'menara', gradient: 'night' },
};

/** Judul & deskripsi lencana sesuai bahasa; jatuh ke teks Indonesia di BADGES bila belum ada terjemahan. */
function useBadgeText() {
  const { t } = useT();
  return (b: BadgeDef) => {
    const k = badgeKeys(b.id);
    return k ? { title: t(k.title), description: t(k.description) } : { title: b.title, description: b.description };
  };
}

/** Kisi lencana: satu ubin per jenis (tingkatan digabung). Ketuk untuk detail & progres. */
export function BadgeGrid({ stats }: { stats: Stats }) {
  const t = useTheme();
  const { t: tr } = useT();
  const tracks = badgeTracks(stats);
  // Yang sudah diraih dulu, lalu yang paling dekat diraih.
  const sorted = [...tracks].sort((a, b) => b.tiersEarned - a.tiersEarned || b.progress - a.progress);
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const shown = all ? sorted : sorted.slice(0, 6);
  const selected = sorted.find((x) => x.series === open) ?? null;
  const earnedCount = tracks.reduce((n, x) => n + x.tiersEarned, 0);
  const totalTiers = tracks.reduce((n, x) => n + x.tiers, 0);

  return (
    <View style={{ gap: space.md }}>
      <Text variant="small" muted>{tr('missions.badgeGrid.summary', { earned: earnedCount, total: totalTiers })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {shown.map((tr) => (
          <Tile key={tr.series} track={tr} selected={open === tr.series} onPress={() => setOpen(open === tr.series ? null : tr.series)} />
        ))}
      </View>
      {selected ? <Detail track={selected} /> : null}
      {sorted.length > 6 ? (
        <Pressable accessibilityRole="button" onPress={() => setAll(!all)} style={{ alignSelf: 'center', padding: space.sm }}>
          <RNText style={{ color: t.primary, fontWeight: '600' }}>{all ? tr('missions.badgeGrid.showLess') : tr('missions.badgeGrid.showAll', { n: sorted.length })}</RNText>
        </Pressable>
      ) : null}
    </View>
  );
}

function Tile({ track, selected, onPress }: { track: BadgeTrack; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const scale = useState(() => new Animated.Value(1))[0];
  const { t: tr } = useT();
  const text = useBadgeText();
  const def = text(track.current ?? track.next!);
  const earned = track.tiersEarned > 0;
  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1.06 : 1, useNativeDriver: true, friction: 5 }).start();
  }, [selected, scale]);
  return (
    <Animated.View style={{ width: '31.5%', transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${def.title}${earned ? tr('missions.badgeGrid.earned') : tr('missions.badgeGrid.notEarned')}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{
          alignItems: 'center', gap: 4, paddingVertical: space.md, paddingHorizontal: 6, borderRadius: radius.lg,
          backgroundColor: earned ? t.surface : t.surfaceAlt,
          borderWidth: selected ? 2 : 1, borderColor: selected ? t.primary : earned ? t.accent : t.border,
        }}
      >
        <HexBadge glyph={(LOOK[track.series] ?? LOOK.catatan!).glyph} gradient={(LOOK[track.series] ?? LOOK.catatan!).gradient} earned={earned} size={64} />
        <RNText numberOfLines={2} style={{ color: earned ? t.text : t.muted, fontSize: 12, fontWeight: '600', textAlign: 'center', minHeight: 32 }}>{def.title}</RNText>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {Array.from({ length: track.tiers }, (_, i) => (
            <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i < track.tiersEarned ? t.accent : t.border }} />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Detail({ track }: { track: BadgeTrack }) {
  const t = useTheme();
  const { t: tr } = useT();
  const text = useBadgeText();
  const def = text(track.current ?? track.next!);
  const next = track.next ? text(track.next) : null;
  return (
    <Card tone="accent">
      <Text variant="heading">{def.title}</Text>
      <Text muted>{def.description}</Text>
      {track.next ? (
        <>
          <Text variant="label">{track.current ? tr('missions.badgeGrid.next', { title: next!.title }) : tr('missions.badgeGrid.progress')} · {Math.min(track.value, track.next.target)}/{track.next.target}</Text>
          <ProgressBar value={track.value / track.next.target} color={t.accent} />
          <Text variant="small" muted>{next!.description}</Text>
        </>
      ) : (
        <Text variant="label" color={t.accent}>{tr('missions.badgeGrid.allDone')}</Text>
      )}
    </Card>
  );
}
