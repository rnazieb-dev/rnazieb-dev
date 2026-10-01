import type { Mission, MissionCategory } from '@/content/types';
import { type DayKey, weekStart } from '@/lib/dates';
import { activeSeasons } from '@/lib/hijri';
import { hashString, seededRng, shuffled } from '@/lib/random';

/** Jenis pemilihan: deterministik per (hari, pengguna) agar sama di semua perangkat. */
const pickRng = (...parts: string[]) => seededRng(hashString(parts.join('|')));

function maxDifficultyFor(level: number): 1 | 2 | 3 {
  if (level >= 4) return 3;
  if (level >= 2) return 2;
  return 1;
}

/** Misi harian (3): kategori berbeda, kesulitan menyesuaikan level, tanpa musiman/side. */
export function dailyMissions(catalog: readonly Mission[], day: DayKey, userSeed: string, level: number, count = 3): Mission[] {
  const rng = pickRng('daily', day, userSeed);
  const maxD = maxDifficultyFor(level);
  const pool = shuffled(
    catalog.filter((m) => m.cadence === 'daily' && m.difficulty <= maxD),
    rng,
  );
  const picked: Mission[] = [];
  const cats = new Set<MissionCategory>();
  for (const m of pool) {
    if (picked.length >= count) break;
    if (cats.has(m.category)) continue;
    cats.add(m.category);
    picked.push(m);
  }
  for (const m of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(m)) picked.push(m);
  }
  return picked;
}

/** Misi mingguan (2): stabil sepanjang pekan (Senin–Ahad). */
export function weeklyMissions(catalog: readonly Mission[], day: DayKey, userSeed: string, level: number, count = 2): Mission[] {
  const wk = weekStart(day);
  const rng = pickRng('weekly', wk, userSeed);
  const maxD = maxDifficultyFor(level);
  return shuffled(
    catalog.filter((m) => m.cadence === 'weekly' && m.difficulty <= maxD),
    rng,
  ).slice(0, count);
}

/** Misi musiman yang aktif pada hari tersebut (Jumat, Ramadan, dst.; perkiraan tabular). */
export function seasonalMissions(catalog: readonly Mission[], day: DayKey): Mission[] {
  const seasons = new Set(activeSeasons(day));
  return catalog.filter((m) => m.cadence === 'seasonal' && m.season && seasons.has(m.season));
}

/**
 * Side quest kejutan: peluang 60% per hari muncul, jenisnya acak.
 * Ini kejutan JENIS misi — bukan undian hadiah (tidak ada imbalan acak).
 */
export function sideQuest(catalog: readonly Mission[], day: DayKey, userSeed: string, level: number): Mission | null {
  const rng = pickRng('side', day, userSeed);
  if (rng() > 0.6) return null;
  const maxD = maxDifficultyFor(level);
  const pool = catalog.filter((m) => m.cadence === 'side' && m.difficulty <= maxD);
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

export interface TodaysMissions {
  daily: Mission[];
  weekly: Mission[];
  seasonal: Mission[];
  side: Mission | null;
}

export function missionsForDay(catalog: readonly Mission[], day: DayKey, userSeed: string, level: number): TodaysMissions {
  return {
    daily: dailyMissions(catalog, day, userSeed, level),
    weekly: weeklyMissions(catalog, day, userSeed, level),
    seasonal: seasonalMissions(catalog, day),
    side: sideQuest(catalog, day, userSeed, level),
  };
}
