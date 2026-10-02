import {
  activityDays,
  categoryCounts,
  completedMissionCounts,
  pointTotals,
  uzurDays,
} from '@/db/repos';
import type { Db } from '@/db/types';
import type { DayKey } from '@/lib/dates';
import { type BadgeDef, type Stats, earnedBadges } from './badges';
import { levelFor } from './points';
import { computeStreak } from './streak';

export interface Progress {
  /** Tampilan PRIBADI (menyertakan amalan rahasia). Jangan pernah dikirim ke server/lingkaran. */
  personal: { points: number; level: ReturnType<typeof levelFor>; streak: number; activeToday: boolean; secretCount: number };
  /** Tampilan PUBLIK (hanya amal yang dibagikan) — satu-satunya yang boleh tampil ke orang lain. */
  publicView: { points: number; level: ReturnType<typeof levelFor>; streak: number };
  badges: BadgeDef[];
  stats: Stats;
}

export async function loadProgress(
  db: Db,
  today: DayKey,
  extras: { circlesJoined?: number; challengesContributed?: number } = {},
): Promise<Progress> {
  const [totals, uzur, allDays, pubDays, catAll, shared] = await Promise.all([
    pointTotals(db),
    uzurDays(db),
    activityDays(db, { includeSecret: true }),
    activityDays(db, { includeSecret: false }),
    categoryCounts(db, { includeSecret: true }),
    completedMissionCounts(db),
  ]);
  const streakAll = computeStreak(allDays, uzur, today);
  const streakPub = computeStreak(pubDays, uzur, today);
  const personalPoints = totals.publicPoints + totals.secretPoints;
  const stats: Stats = {
    deedsTotal: Object.values(catAll).reduce((a, b) => a + (b ?? 0), 0),
    distinctDays: allDays.size,
    byCategory: catAll,
    missionsCompleted: shared.total,
    sharedMissionsCompleted: shared.shared,
    streak: streakAll.count,
    circlesJoined: extras.circlesJoined ?? 0,
    challengesContributed: extras.challengesContributed ?? 0,
  };
  return {
    personal: {
      points: personalPoints,
      level: levelFor(personalPoints),
      streak: streakAll.count,
      activeToday: streakAll.activeToday,
      secretCount: totals.secretCount,
    },
    publicView: { points: totals.publicPoints, level: levelFor(totals.publicPoints), streak: streakPub.count },
    badges: earnedBadges(stats),
    stats,
  };
}
