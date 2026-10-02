export interface SurahMeta {
  number: number;
  nameAr: string;
  translit: string;
  /** Arti nama surah (Indonesia). */
  meaning: string;
  type: 'meccan' | 'medinan';
  count: number;
}

export interface Verse {
  surah: number;
  ayah: number;
  arabic: string;
  translit: string;
  /** Terjemah Kemenag RI (Indonesia). */
  id: string;
}

type Raw = { s: [string, string, string, 'm' | 'd', number][]; v: [string, string, string][][] };
let cache: Raw | null = null;
/** Dimuat malas: berkas ~3 MB hanya dievaluasi saat layar Al-Qur'an dibuka. */
function raw(): Raw {
   
  cache ??= require('@/content/quran.generated.json') as Raw;
  return cache;
}

export const TOTAL_VERSES = 6236;

export function surahs(): SurahMeta[] {
  return raw().s.map(([nameAr, translit, meaning, t, count], i) => ({ number: i + 1, nameAr, translit, meaning, type: t === 'm' ? 'meccan' : 'medinan', count }));
}

export function versesOf(surah: number): Verse[] {
  return (raw().v[surah - 1] ?? []).map(([arabic, translit, id], i) => ({ surah, ayah: i + 1, arabic, translit, id }));
}

/** Awal tiap juz (surah, ayat) — pembagian standar Mushaf Madinah. */
export const JUZ_START: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 83], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

const cmp = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];

export function juzOf(surah: number, ayah: number): number {
  let j = 1;
  for (let i = 0; i < JUZ_START.length; i++) if (cmp([surah, ayah], JUZ_START[i]!) >= 0) j = i + 1;
  return j;
}

/** Urutan global ayat (1..6236) — untuk progres khatam. */
export function globalIndex(counts: number[], surah: number, ayah: number): number {
  let n = 0;
  for (let i = 0; i < surah - 1; i++) n += counts[i] ?? 0;
  return n + ayah;
}

export function filterSurahs(list: SurahMeta[], q: string): SurahMeta[] {
  const s = q.trim().toLowerCase().replace(/[-'’\s]/g, '');
  if (!s) return list;
  return list.filter((x) => String(x.number) === s || x.translit.toLowerCase().replace(/[-'’\s]/g, '').includes(s) || x.meaning.toLowerCase().includes(q.trim().toLowerCase()) || x.nameAr.includes(q.trim()));
}

export interface QuranState {
  last: { surah: number; ayah: number } | null;
  /** Ayat terjauh yang pernah ditandai dibaca pada putaran khatam ini. */
  khatamFurthest: number;
  khatamRound: number;
  bookmarks: { surah: number; ayah: number; at: string }[];
}

export const emptyQuranState = (): QuranState => ({ last: null, khatamFurthest: 0, khatamRound: 0, bookmarks: [] });

export function markRead(s: QuranState, counts: number[], surah: number, ayah: number): QuranState {
  const g = globalIndex(counts, surah, ayah);
  const furthest = Math.max(s.khatamFurthest, g);
  return furthest >= TOTAL_VERSES
    ? { ...s, last: { surah, ayah }, khatamFurthest: 0, khatamRound: s.khatamRound + 1 }
    : { ...s, last: { surah, ayah }, khatamFurthest: furthest };
}

export function toggleBookmark(s: QuranState, surah: number, ayah: number, now: string): QuranState {
  const has = s.bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
  return { ...s, bookmarks: has ? s.bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah)) : [{ surah, ayah, at: now }, ...s.bookmarks] };
}
