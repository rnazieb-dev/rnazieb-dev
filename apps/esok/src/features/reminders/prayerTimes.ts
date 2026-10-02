/**
 * Perhitungan waktu salat astronomis (parameter Kemenag RI: Subuh 20°, Isya 18°,
 * Asar mazhab Syafi'i, ihtiyath +2 menit). Hanya untuk PENGINGAT — bukan acuan
 * ibadah; pengguna dianjurkan merujuk jadwal resmi setempat.
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerTimes {
  subuh: number; // jam desimal waktu lokal
  terbit: number;
  zuhur: number;
  asar: number;
  maghrib: number;
  isya: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const fix = (a: number, b: number) => a - b * Math.floor(a / b);

function julian(y: number, m: number, d: number): number {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPosition(jd: number): { decl: number; eqt: number } {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
  const eqt = q / 15 - fix(RA, 24);
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L))));
  return { decl, eqt: ((eqt + 12) % 24) - 12 };
}

function hourAngle(angle: number, lat: number, decl: number): number {
  const v =
    (-Math.sin(rad(angle)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.cos(rad(decl)));
  return deg(Math.acos(Math.max(-1, Math.min(1, v)))) / 15;
}

export type CalcMethod = 'auto' | 'kemenag' | 'mwl' | 'isna' | 'egypt' | 'makkah' | 'karachi' | 'jakim' | 'muis' | 'diyanet';
export type ConcreteMethod = Exclude<CalcMethod, 'auto'>;

interface MethodParams {
  fajr: number;
  /** Sudut Isya, atau menit setelah Maghrib (Umm al-Qura). */
  isha: number | { minutes: number };
  /** Ihtiyath (menit) yang ditambahkan ke waktu salat. */
  safety: number;
}

export const METHODS: Record<ConcreteMethod, MethodParams & { label: string }> = {
  kemenag: { label: 'Kemenag RI (Indonesia)', fajr: 20, isha: 18, safety: 2 },
  jakim: { label: 'JAKIM (Malaysia)', fajr: 20, isha: 18, safety: 2 },
  muis: { label: 'MUIS (Singapore)', fajr: 20, isha: 18, safety: 2 },
  mwl: { label: 'Muslim World League', fajr: 18, isha: 17, safety: 0 },
  isna: { label: 'ISNA (North America)', fajr: 15, isha: 15, safety: 0 },
  egypt: { label: 'Egyptian General Authority', fajr: 19.5, isha: 17.5, safety: 0 },
  makkah: { label: 'Umm al-Qura (Makkah)', fajr: 18.5, isha: { minutes: 90 }, safety: 0 },
  karachi: { label: 'University of Islamic Sciences, Karachi', fajr: 18, isha: 18, safety: 0 },
  diyanet: { label: 'Diyanet (Türkiye)', fajr: 18, isha: 17, safety: 0 },
};

const inBox = (c: Coordinates, lat: [number, number], lon: [number, number]) =>
  c.latitude >= lat[0] && c.latitude <= lat[1] && c.longitude >= lon[0] && c.longitude <= lon[1];

/** Tebakan metode berdasarkan wilayah (kotak kasar). Pengguna selalu bisa memilih sendiri. */
export function autoMethod(c: Coordinates): ConcreteMethod {
  if (inBox(c, [1.15, 1.48], [103.6, 104.1])) return 'muis';
  if (inBox(c, [0.8, 7.5], [99.6, 119.3])) return 'jakim';
  if (inBox(c, [-11.2, 6.3], [94.7, 141.1])) return 'kemenag';
  if (inBox(c, [16, 32.5], [34.5, 56])) return 'makkah';
  if (inBox(c, [35.8, 42.2], [25.6, 44.9])) return 'diyanet';
  if (inBox(c, [21.5, 31.8], [24.6, 36.9])) return 'egypt';
  if (inBox(c, [5, 37.5], [60, 92.7])) return 'karachi';
  if (inBox(c, [14, 72], [-170, -50])) return 'isna';
  return 'mwl';
}

export const resolveMethod = (m: CalcMethod | undefined, c: Coordinates): ConcreteMethod => (!m || m === 'auto' ? autoMethod(c) : m);

export function computePrayerTimes(
  year: number,
  month: number,
  day: number,
  coords: Coordinates,
  tzHours: number,
  opts: { method?: ConcreteMethod; hanafi?: boolean } = {},
): PrayerTimes {
  const m = METHODS[opts.method ?? 'kemenag'];
  const jd = julian(year, month, day) - coords.longitude / (15 * 24);
  const { decl, eqt } = sunPosition(jd + 0.5);
  const noon = 12 - eqt;
  const zuhurBase = noon + tzHours - coords.longitude / 15;
  const t = (angle: number) => hourAngle(angle, coords.latitude, decl);
  const shadow = opts.hanafi ? 2 : 1;
  const asrAngle = -deg(Math.atan(1 / (shadow + Math.tan(rad(Math.abs(coords.latitude - decl))))));
  const ihtiyath = m.safety / 60;
  const maghrib = zuhurBase + t(0.833) + ihtiyath;
  return {
    subuh: zuhurBase - t(m.fajr) + ihtiyath,
    terbit: zuhurBase - t(0.833),
    zuhur: zuhurBase + ihtiyath,
    asar: zuhurBase + t(asrAngle) + ihtiyath,
    maghrib,
    isya: typeof m.isha === 'number' ? zuhurBase + t(m.isha) + ihtiyath : maghrib + m.isha.minutes / 60,
  };
}

export function formatHour(h: number): string {
  const total = Math.round(fix(h, 24) * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
