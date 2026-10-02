import { type CalcMethod, type Coordinates, type PrayerTimes, computePrayerTimes, formatHour, resolveMethod } from '@/features/reminders/prayerTimes';

export interface CalcOpts {
  method?: CalcMethod;
  hanafi?: boolean;
}

export type PrayerKey = 'subuh' | 'terbit' | 'zuhur' | 'asar' | 'maghrib' | 'isya';
/** Waktu yang bisa diberi pengingat adzan (terbit bukan waktu salat). */
export type AlertKey = Exclude<PrayerKey, 'terbit'>;

export const PRAYER_ORDER: PrayerKey[] = ['subuh', 'terbit', 'zuhur', 'asar', 'maghrib', 'isya'];
export const PRAYER_LABEL: Record<PrayerKey, string> = {
  subuh: 'Subuh',
  terbit: 'Terbit',
  zuhur: 'Zuhur',
  asar: 'Asar',
  maghrib: 'Maghrib',
  isya: 'Isya',
};
/** Pada hari Jumat, waktu Zuhur ditampilkan sebagai Jumat (salat Jumat bagi laki-laki). */
export const labelFor = (k: PrayerKey, date: Date) => (k === 'zuhur' && date.getDay() === 5 ? 'Jumat' : PRAYER_LABEL[k]);

export interface PrayerSlot {
  key: PrayerKey;
  at: Date;
  hhmm: string;
}

export function timesFor(date: Date, coords: Coordinates, opts: CalcOpts = {}): PrayerTimes {
  return computePrayerTimes(date.getFullYear(), date.getMonth() + 1, date.getDate(), coords, -date.getTimezoneOffset() / 60, {
    method: resolveMethod(opts.method, coords),
    hanafi: opts.hanafi,
  });
}

export function slotsFor(date: Date, coords: Coordinates, opts: CalcOpts = {}): PrayerSlot[] {
  const t = timesFor(date, coords, opts);
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return PRAYER_ORDER.map((key) => {
    const at = new Date(base.getTime() + Math.round(t[key] * 60) * 60000);
    return { key, at, hhmm: formatHour(t[key]) };
  });
}

/** Salat berikutnya (melewati 'terbit'); bila Isya sudah lewat → Subuh esok. */
export function nextPrayer(now: Date, coords: Coordinates, opts: CalcOpts = {}): PrayerSlot {
  const today = slotsFor(now, coords, opts).filter((s) => s.key !== 'terbit');
  const upcoming = today.find((s) => s.at.getTime() > now.getTime());
  if (upcoming) return upcoming;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return slotsFor(tomorrow, coords, opts)[0]!;
}

/** Waktu yang sedang berjalan (untuk menyorot baris), atau null sebelum Subuh. */
export function currentPrayer(now: Date, coords: Coordinates, opts: CalcOpts = {}): PrayerKey | null {
  const past = slotsFor(now, coords, opts).filter((s) => s.at.getTime() <= now.getTime());
  return past.length ? past[past.length - 1]!.key : null;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} menit lagi`;
  return `${h} jam ${m} menit lagi`;
}

const KAABA = { latitude: 21.4225, longitude: 39.8262 };

/** Arah kiblat (derajat dari utara sejati, searah jarum jam). */
export function qiblaBearing(c: Coordinates): number {
  const r = Math.PI / 180;
  const dLon = (KAABA.longitude - c.longitude) * r;
  const lat1 = c.latitude * r;
  const lat2 = KAABA.latitude * r;
  const y = Math.sin(dLon);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLon);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

/** Jarak lingkaran besar ke Ka'bah, km. */
export function distanceToKaabaKm(c: Coordinates): number {
  const r = Math.PI / 180;
  const dLat = (KAABA.latitude - c.latitude) * r;
  const dLon = (KAABA.longitude - c.longitude) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(c.latitude * r) * Math.cos(KAABA.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Selisih sudut terkecil (-180..180). */
export const angleDelta = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

export interface PrayerAlert {
  key: AlertKey;
  at: Date;
}

/** Pengingat adzan untuk `days` hari ke depan (hanya yang belum lewat dan diaktifkan). */
export function prayerAlerts(now: Date, coords: Coordinates, enabled: Partial<Record<AlertKey, boolean>>, days = 2, opts: CalcOpts = {}): PrayerAlert[] {
  const out: PrayerAlert[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    for (const s of slotsFor(d, coords, opts)) {
      if (s.key === 'terbit' || !enabled[s.key]) continue;
      if (s.at.getTime() > now.getTime()) out.push({ key: s.key, at: s.at });
    }
  }
  return out;
}
