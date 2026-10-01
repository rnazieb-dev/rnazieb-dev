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

export function computePrayerTimes(
  year: number,
  month: number,
  day: number,
  coords: Coordinates,
  tzHours: number,
): PrayerTimes {
  const jd = julian(year, month, day) - coords.longitude / (15 * 24);
  const { decl, eqt } = sunPosition(jd + 0.5);
  const noon = 12 - eqt;
  const zuhurBase = noon + tzHours - coords.longitude / 15;
  const t = (angle: number) => hourAngle(angle, coords.latitude, decl);
  const asrAngle = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(coords.latitude - decl))))));
  const ihtiyath = 2 / 60;
  return {
    subuh: zuhurBase - t(20) + ihtiyath,
    terbit: zuhurBase - t(0.833),
    zuhur: zuhurBase + ihtiyath,
    asar: zuhurBase + t(asrAngle) + ihtiyath,
    maghrib: zuhurBase + t(0.833) + ihtiyath,
    isya: zuhurBase + t(18) + ihtiyath,
  };
}

export function formatHour(h: number): string {
  const total = Math.round(fix(h, 24) * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
