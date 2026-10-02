import type { MissionCategory } from '@/content/types';

export interface Stats {
  deedsTotal: number;
  distinctDays: number;
  byCategory: Partial<Record<MissionCategory, number>>;
  missionsCompleted: number;
  sharedMissionsCompleted: number;
  streak: number;
  circlesJoined: number;
  challengesContributed: number;
}

export interface BadgeDef {
  id: string;
  /** Deskriptif dan netral — tanpa gelar keagamaan atau klaim pahala. */
  title: string;
  description: string;
  /** Lencana dengan `series` sama adalah tingkatan dari satu jenis (mis. 1 → 10 → 50 catatan). */
  series: string;
  icon: string;
  target: number;
  value: (s: Stats) => number;
  earned: (s: Stats) => boolean;
}

const cat = (s: Stats, c: MissionCategory) => s.byCategory[c] ?? 0;

const def = (b: Omit<BadgeDef, 'earned'>): BadgeDef => ({ ...b, earned: (s) => b.value(s) >= b.target });

export const BADGES: BadgeDef[] = [
  def({ id: 'first-deed', series: 'catatan', icon: '🌱', title: 'Langkah Pertama', description: 'Mencatat amal pertama.', target: 1, value: (s) => s.deedsTotal }),
  def({ id: 'ten-deeds', series: 'catatan', icon: '🌿', title: 'Sepuluh Catatan', description: 'Mencatat 10 amal.', target: 10, value: (s) => s.deedsTotal }),
  def({ id: 'fifty-deeds', series: 'catatan', icon: '🌳', title: 'Lima Puluh Catatan', description: 'Mencatat 50 amal.', target: 50, value: (s) => s.deedsTotal }),
  def({ id: 'seven-days', series: 'hari', icon: '📅', title: 'Tujuh Hari Beramal', description: 'Beramal pada 7 hari berbeda.', target: 7, value: (s) => s.distinctDays }),
  def({ id: 'thirty-days', series: 'hari', icon: '🗓️', title: 'Tiga Puluh Hari Beramal', description: 'Beramal pada 30 hari berbeda.', target: 30, value: (s) => s.distinctDays }),
  def({ id: 'streak-7', series: 'beruntun', icon: '🔥', title: 'Seminggu Beruntun', description: 'Beramal 7 hari berturut-turut.', target: 7, value: (s) => s.streak }),
  def({ id: 'streak-30', series: 'beruntun', icon: '✨', title: 'Sebulan Beruntun', description: 'Beramal 30 hari berturut-turut.', target: 30, value: (s) => s.streak }),
  def({ id: 'family-5', series: 'keluarga', icon: '🏠', title: 'Dekat dengan Keluarga', description: '5 amal untuk keluarga.', target: 5, value: (s) => cat(s, 'keluarga') }),
  def({ id: 'give-5', series: 'sedekah', icon: '🤲', title: 'Rajin Berbagi', description: '5 amal berbagi/sedekah.', target: 5, value: (s) => cat(s, 'sedekah') }),
  def({ id: 'learn-5', series: 'ilmu', icon: '📖', title: 'Pembelajar', description: '5 amal menuntut atau berbagi ilmu.', target: 5, value: (s) => cat(s, 'ilmu') }),
  def({ id: 'forgive-3', series: 'memaafkan', icon: '🤝', title: 'Lapang Dada', description: '3 amal memaafkan/meminta maaf.', target: 3, value: (s) => cat(s, 'memaafkan') }),
  def({ id: 'green-3', series: 'lingkungan', icon: '🍃', title: 'Peduli Lingkungan', description: '3 amal untuk lingkungan.', target: 3, value: (s) => cat(s, 'lingkungan') }),
  def({ id: 'mission-10', series: 'misi', icon: '🎯', title: 'Sepuluh Misi', description: 'Menyelesaikan 10 misi.', target: 10, value: (s) => s.missionsCompleted }),
  def({ id: 'mission-50', series: 'misi', icon: '🏅', title: 'Lima Puluh Misi', description: 'Menyelesaikan 50 misi.', target: 50, value: (s) => s.missionsCompleted }),
  def({ id: 'together-3', series: 'bersama', icon: '👥', title: 'Beramal Bersama', description: '3 misi bersama selesai.', target: 3, value: (s) => s.sharedMissionsCompleted }),
  def({ id: 'circle-join', series: 'grup', icon: '🫂', title: 'Bergabung Grup', description: 'Bergabung ke sebuah grup.', target: 1, value: (s) => s.circlesJoined }),
  def({ id: 'challenge-1', series: 'tantangan', icon: '🏁', title: 'Ikut Tantangan', description: 'Berkontribusi pada tantangan grup.', target: 1, value: (s) => s.challengesContributed }),
];

export interface BadgeTrack {
  series: string;
  /** Tingkatan tertinggi yang sudah diraih (null = belum ada). */
  current: BadgeDef | null;
  /** Tingkatan berikutnya (null = semua tingkatan selesai). */
  next: BadgeDef | null;
  value: number;
  /** 0..1 menuju `next` (1 bila selesai). */
  progress: number;
  tiers: number;
  tiersEarned: number;
}

/** Satukan tingkatan per jenis agar lencana tidak menumpuk: satu kartu per jenis dengan progres ke tingkat berikutnya. */
export function badgeTracks(s: Stats): BadgeTrack[] {
  const bySeries = new Map<string, BadgeDef[]>();
  for (const b of BADGES) bySeries.set(b.series, [...(bySeries.get(b.series) ?? []), b]);
  return [...bySeries.entries()].map(([series, list]) => {
    const tiers = [...list].sort((a, b) => a.target - b.target);
    const value = tiers[0]!.value(s);
    const earned = tiers.filter((b) => b.earned(s));
    const next = tiers.find((b) => !b.earned(s)) ?? null;
    const prevTarget = earned.length ? earned[earned.length - 1]!.target : 0;
    const progress = next ? Math.max(0, Math.min(1, (value - prevTarget) / (next.target - prevTarget))) : 1;
    return { series, current: earned[earned.length - 1] ?? null, next, value, progress, tiers: tiers.length, tiersEarned: earned.length };
  });
}

export const earnedBadges = (s: Stats): BadgeDef[] => BADGES.filter((b) => b.earned(s));
