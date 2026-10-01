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
  earned: (s: Stats) => boolean;
}

const cat = (s: Stats, c: MissionCategory) => s.byCategory[c] ?? 0;

export const BADGES: BadgeDef[] = [
  { id: 'first-deed', title: 'Langkah Pertama', description: 'Mencatat amal pertama.', earned: (s) => s.deedsTotal >= 1 },
  { id: 'ten-deeds', title: 'Sepuluh Catatan', description: 'Mencatat 10 amal.', earned: (s) => s.deedsTotal >= 10 },
  { id: 'fifty-deeds', title: 'Lima Puluh Catatan', description: 'Mencatat 50 amal.', earned: (s) => s.deedsTotal >= 50 },
  { id: 'seven-days', title: 'Tujuh Hari Beramal', description: 'Beramal pada 7 hari berbeda.', earned: (s) => s.distinctDays >= 7 },
  { id: 'thirty-days', title: 'Tiga Puluh Hari Beramal', description: 'Beramal pada 30 hari berbeda.', earned: (s) => s.distinctDays >= 30 },
  { id: 'streak-7', title: 'Seminggu Beruntun', description: 'Beramal 7 hari berturut-turut.', earned: (s) => s.streak >= 7 },
  { id: 'streak-30', title: 'Sebulan Beruntun', description: 'Beramal 30 hari berturut-turut.', earned: (s) => s.streak >= 30 },
  { id: 'family-5', title: 'Dekat dengan Keluarga', description: '5 amal untuk keluarga.', earned: (s) => cat(s, 'keluarga') >= 5 },
  { id: 'give-5', title: 'Rajin Berbagi', description: '5 amal berbagi/sedekah.', earned: (s) => cat(s, 'sedekah') >= 5 },
  { id: 'learn-5', title: 'Pembelajar', description: '5 amal menuntut atau berbagi ilmu.', earned: (s) => cat(s, 'ilmu') >= 5 },
  { id: 'forgive-3', title: 'Lapang Dada', description: '3 amal memaafkan/meminta maaf.', earned: (s) => cat(s, 'memaafkan') >= 3 },
  { id: 'green-3', title: 'Peduli Lingkungan', description: '3 amal untuk lingkungan.', earned: (s) => cat(s, 'lingkungan') >= 3 },
  { id: 'mission-10', title: 'Sepuluh Misi', description: 'Menyelesaikan 10 misi.', earned: (s) => s.missionsCompleted >= 10 },
  { id: 'mission-50', title: 'Lima Puluh Misi', description: 'Menyelesaikan 50 misi.', earned: (s) => s.missionsCompleted >= 50 },
  { id: 'together-3', title: 'Beramal Bersama', description: '3 misi bersama selesai.', earned: (s) => s.sharedMissionsCompleted >= 3 },
  { id: 'circle-join', title: 'Bergabung Lingkaran', description: 'Bergabung ke sebuah lingkaran.', earned: (s) => s.circlesJoined >= 1 },
  { id: 'challenge-1', title: 'Ikut Tantangan', description: 'Berkontribusi pada tantangan lingkaran.', earned: (s) => s.challengesContributed >= 1 },
];

export const earnedBadges = (s: Stats): BadgeDef[] => BADGES.filter((b) => b.earned(s));
