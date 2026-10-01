import { BADGES, earnedBadges } from '@/features/gamification/badges';
import { DAILY_PUBLIC_POINT_CAP, capDaily, levelFor } from '@/features/gamification/points';
import { computeStreak } from '@/features/gamification/streak';

describe('points & level', () => {
  it('level naik sesuai ambang, nama netral', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(60).level).toBe(2);
    expect(levelFor(99999).next).toBeNull();
    const names = [0, 60, 160, 320, 560, 900, 1400, 2100].map((p) => levelFor(p).name.toLowerCase());
    for (const n of names) expect(n).not.toMatch(/wali|syuhada|surga|ulama|kyai|ustadz|saleh/);
  });

  it('batas harian diterapkan', () => {
    const out = capDaily([
      { day: '2026-10-01', amount: 60 },
      { day: '2026-10-01', amount: 60 },
      { day: '2026-10-02', amount: 30 },
    ]);
    expect(out.map((e) => e.amount)).toEqual([60, DAILY_PUBLIC_POINT_CAP - 60, 30]);
  });
});

describe('streak lembut', () => {
  const d = (s: string) => s;
  it('menghitung hari berturut-turut sampai hari ini', () => {
    const r = computeStreak(new Set([d('2026-10-01'), d('2026-09-30'), d('2026-09-29')]), new Set(), '2026-10-01');
    expect(r).toEqual({ count: 3, activeToday: true });
  });
  it('hari ini belum beramal tidak memutus streak', () => {
    const r = computeStreak(new Set(['2026-09-30', '2026-09-29']), new Set(), '2026-10-01');
    expect(r).toEqual({ count: 2, activeToday: false });
  });
  it('hari uzur menjembatani tanpa menambah hitungan', () => {
    const r = computeStreak(new Set(['2026-10-01', '2026-09-28']), new Set(['2026-09-30', '2026-09-29']), '2026-10-01');
    expect(r.count).toBe(2);
  });
  it('terputus jika ada hari kosong tanpa uzur', () => {
    const r = computeStreak(new Set(['2026-10-01', '2026-09-29']), new Set(), '2026-10-01');
    expect(r.count).toBe(1);
  });
});

describe('badges', () => {
  it('deskriptif, tanpa klaim pahala/gelar keagamaan', () => {
    for (const b of BADGES) expect(`${b.title} ${b.description}`.toLowerCase()).not.toMatch(/pahala|surga|wali|syuhada|ganjaran/);
  });
  it('terbuka sesuai statistik', () => {
    const base = { deedsTotal: 0, distinctDays: 0, byCategory: {}, missionsCompleted: 0, sharedMissionsCompleted: 0, streak: 0, circlesJoined: 0, challengesContributed: 0 };
    expect(earnedBadges(base)).toHaveLength(0);
    expect(earnedBadges({ ...base, deedsTotal: 10, streak: 7 }).map((b) => b.id)).toEqual(
      expect.arrayContaining(['first-deed', 'ten-deeds', 'streak-7']),
    );
  });
});
