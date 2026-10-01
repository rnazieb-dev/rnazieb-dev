import { type DayKey, dayOfWeek, fromDayKey } from './dates';
import type { Season } from '@/content/types';

export interface HijriDate {
  year: number;
  month: number; // 1..12
  day: number;
}

/**
 * Konversi tabular (algoritma Kuwaiti). Perkiraan: bisa berbeda ±1–2 hari dari
 * penetapan resmi (rukyat/hisab Kemenag). Jangan dipakai untuk menentukan ibadah;
 * aplikasi selalu menyarankan mengikuti penetapan resmi.
 */
export function gregorianToHijri(date: Date): HijriDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  let jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d -
    32075;
  jd = jd - 1948440 + 10632;
  const n = Math.floor((jd - 1) / 10631);
  jd = jd - 10631 * n + 354;
  const j =
    Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719) +
    Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
  jd = jd - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * jd) / 709);
  const day = jd - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

export const NAMA_BULAN_HIJRI = [
  'Muharram', 'Safar', "Rabiul Awal", "Rabiul Akhir", 'Jumadil Awal', 'Jumadil Akhir',
  'Rajab', "Sya'ban", 'Ramadan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah',
];

/** Musim/hari istimewa yang aktif pada tanggal tersebut (perkiraan tabular). */
export function activeSeasons(day: DayKey): Season[] {
  const date = fromDayKey(day);
  const h = gregorianToHijri(date);
  const dow = dayOfWeek(day);
  const out: Season[] = [];
  if (dow === 5) out.push('jumat');
  if (dow === 1 || dow === 4) out.push('senin_kamis');
  if (h.month === 9) out.push('ramadan');
  if (h.month === 12 && h.day >= 1 && h.day <= 10) out.push('sepuluh_dzulhijjah');
  if (h.month === 12 && h.day === 9) out.push('arafah');
  if (h.month === 1 && h.day === 10) out.push('asyura');
  return out;
}
