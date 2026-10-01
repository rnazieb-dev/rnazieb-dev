import { type DayKey, addDays } from '@/lib/dates';

export interface StreakResult {
  /** Jumlah hari beramal berturut-turut (hari uzur tidak menambah, tapi tidak memutus). */
  count: number;
  /** Apakah hari ini sudah ada amal. */
  activeToday: boolean;
}

/**
 * Streak "lembut":
 *  - hari uzur (sakit, haid, safar, dll.) menjembatani tanpa menambah hitungan;
 *  - hari ini belum beramal tidak memutus streak (masih ada waktu);
 *  - tidak ada penalti atau pesan "streak hilang" di UI.
 */
export function computeStreak(active: ReadonlySet<DayKey>, uzur: ReadonlySet<DayKey>, today: DayKey): StreakResult {
  const activeToday = active.has(today);
  let cursor = activeToday ? today : addDays(today, -1);
  let count = 0;
  // Batasi iterasi demi keamanan (10 tahun).
  for (let i = 0; i < 3660; i++) {
    if (active.has(cursor)) count++;
    else if (!uzur.has(cursor)) break;
    cursor = addDays(cursor, -1);
  }
  return { count, activeToday };
}
