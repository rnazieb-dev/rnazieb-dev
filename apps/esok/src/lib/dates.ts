/** Kunci hari lokal "YYYY-MM-DD" (bukan UTC) agar "hari ini" sesuai zona waktu pengguna. */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDayKey(k: DayKey): Date {
  const [y, m, d] = k.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = fromDayKey(k);
  d.setDate(d.getDate() + n);
  return toDayKey(d);
}

export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((fromDayKey(b).getTime() - fromDayKey(a).getTime()) / 86400000);
}

/** Awal pekan (Senin) untuk sebuah hari. */
export function weekStart(k: DayKey): DayKey {
  const d = fromDayKey(k);
  const dow = (d.getDay() + 6) % 7; // Senin=0
  return addDays(k, -dow);
}

export function dayOfWeek(k: DayKey): number {
  return fromDayKey(k).getDay(); // 0=Minggu
}

export const NAMA_HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatDayLong(k: DayKey): string {
  const d = fromDayKey(k);
  return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
