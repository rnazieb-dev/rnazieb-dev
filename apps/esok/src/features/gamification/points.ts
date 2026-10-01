import type { DayKey } from '@/lib/dates';

/** Batas poin publik per hari (dicerminkan di server: award_points_for_deed). */
export const DAILY_PUBLIC_POINT_CAP = 100;
/** Poin untuk amal bebas (di luar katalog misi) — kecil agar tidak bisa dikebut. */
export const CUSTOM_DEED_POINTS = 3;

/**
 * Poin = penanda KONSISTENSI, bukan nilai pahala. Pahala hanya di sisi Allah.
 * Level netral, tanpa gelar keagamaan (tidak ada klaim kedudukan di sisi Allah).
 */
export const LEVELS: { level: number; min: number; name: string }[] = [
  { level: 1, min: 0, name: 'Memulai' },
  { level: 2, min: 60, name: 'Berjalan' },
  { level: 3, min: 160, name: 'Tekun' },
  { level: 4, min: 320, name: 'Konsisten' },
  { level: 5, min: 560, name: 'Teguh' },
  { level: 6, min: 900, name: 'Mantap' },
  { level: 7, min: 1400, name: 'Matang' },
  { level: 8, min: 2100, name: 'Mapan' },
];

export function levelFor(points: number): { level: number; name: string; next: number | null; progress: number } {
  let cur = LEVELS[0]!;
  for (const l of LEVELS) if (points >= l.min) cur = l;
  const idx = LEVELS.findIndex((l) => l.level === cur.level);
  const nextL = LEVELS[idx + 1];
  const progress = nextL ? (points - cur.min) / (nextL.min - cur.min) : 1;
  return { level: cur.level, name: cur.name, next: nextL ? nextL.min : null, progress: Math.min(1, Math.max(0, progress)) };
}

export interface PointEvent {
  day: DayKey;
  amount: number;
}

/** Terapkan batas harian pada daftar poin yang akan diberikan. */
export function capDaily(events: PointEvent[], cap = DAILY_PUBLIC_POINT_CAP): PointEvent[] {
  const used = new Map<DayKey, number>();
  return events.map((e) => {
    const u = used.get(e.day) ?? 0;
    const allowed = Math.max(0, Math.min(e.amount, cap - u));
    used.set(e.day, u + allowed);
    return { day: e.day, amount: allowed };
  });
}

export function sumPoints(events: PointEvent[]): number {
  return events.reduce((s, e) => s + e.amount, 0);
}
