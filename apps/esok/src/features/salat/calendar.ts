import { type HijriDate, gregorianToHijri } from '@/lib/hijri';

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
  hijri: HijriDate;
  isToday: boolean;
}

/** Kisi 6×7 bulan Masehi (mulai Senin) dengan tanggal Hijriah perkiraan per sel. */
export function monthGrid(year: number, month0: number, today: Date): CalendarCell[] {
  const first = new Date(year, month0, 1);
  const offset = (first.getDay() + 6) % 7; // Senin = 0
  const start = new Date(year, month0, 1 - offset);
  const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date, inMonth: date.getMonth() === month0, hijri: gregorianToHijri(date), isToday: same(date, today) };
  });
}

/** Hari-hari yang dianjurkan puasa sunnah (perkiraan): Senin/Kamis & ayyamul bidh 13–15. */
export function sunnahFastHint(c: CalendarCell): string | null {
  if (c.hijri.month === 9) return 'Ramadan';
  if ([13, 14, 15].includes(c.hijri.day)) return 'Ayyamul bidh';
  const dow = c.date.getDay();
  if (dow === 1 || dow === 4) return dow === 1 ? 'Senin' : 'Kamis';
  return null;
}
