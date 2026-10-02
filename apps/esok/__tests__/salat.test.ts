import { angleDelta, distanceToKaabaKm, formatCountdown, nextPrayer, qiblaBearing, slotsFor } from '@/features/salat/logic';
import { monthGrid, sunnahFastHint } from '@/features/salat/calendar';

const JAKARTA = { latitude: -6.2, longitude: 106.82 };
/** Koordinat yang bujurnya sesuai zona waktu proses tes, agar hasil tak bergantung TZ mesin. */
const LOCAL = { latitude: -6.2, longitude: (-new Date(2026, 9, 2).getTimezoneOffset() / 60) * 15 };

describe('salat', () => {
  it('urutan waktu salat naik dalam sehari', () => {
    const s = slotsFor(new Date(2026, 9, 2, 12), LOCAL);
    for (let i = 1; i < s.length; i++) expect(s[i]!.at.getTime()).toBeGreaterThan(s[i - 1]!.at.getTime());
  });
  it('salat berikutnya melewati terbit dan berpindah ke Subuh esok setelah Isya', () => {
    const s = slotsFor(new Date(2026, 9, 2, 12), LOCAL);
    const terbit = s.find((x) => x.key === 'terbit')!;
    expect(nextPrayer(new Date(terbit.at.getTime() + 1000), LOCAL).key).toBe('zuhur');
    const isya = s.find((x) => x.key === 'isya')!;
    const n = nextPrayer(new Date(isya.at.getTime() + 60000), LOCAL);
    expect(n.key).toBe('subuh');
    expect(n.at.getDate()).toBe(3);
  });
  it('arah kiblat Jakarta ~295°, jarak ~7.900 km', () => {
    expect(qiblaBearing(JAKARTA)).toBeGreaterThan(293);
    expect(qiblaBearing(JAKARTA)).toBeLessThan(297);
    expect(distanceToKaabaKm(JAKARTA)).toBeGreaterThan(7800);
    expect(distanceToKaabaKm(JAKARTA)).toBeLessThan(8000);
  });
  it('angleDelta memilih putaran terpendek', () => {
    expect(angleDelta(10, 350)).toBe(20);
    expect(angleDelta(350, 10)).toBe(-20);
  });
  it('format hitung mundur', () => {
    expect(formatCountdown(7 * 60000)).toBe('7 menit lagi');
    expect(formatCountdown(65 * 60000)).toBe('1 jam 5 menit lagi');
  });
});

describe('kalender', () => {
  it('kisi 42 sel mulai Senin, menandai hari ini', () => {
    const g = monthGrid(2026, 9, new Date(2026, 9, 2));
    expect(g).toHaveLength(42);
    expect(g[0]!.date.getDay()).toBe(1);
    expect(g.filter((c) => c.isToday)).toHaveLength(1);
    expect(g.filter((c) => c.inMonth)).toHaveLength(31);
  });
  it('petunjuk puasa sunnah', () => {
    const g = monthGrid(2026, 9, new Date(2026, 9, 2));
    const monday = g.find((c) => c.inMonth && c.date.getDay() === 1 && ![13, 14, 15].includes(c.hijri.day) && c.hijri.month !== 9)!;
    expect(sunnahFastHint(monday)).toBe('Senin');
  });
});

describe('prayerAlerts', () => {
  const { prayerAlerts, slotsFor: slots } = jest.requireActual('@/features/salat/logic') as typeof import('@/features/salat/logic');
  const LOC = { latitude: -6.2, longitude: (-new Date(2026, 9, 2).getTimezoneOffset() / 60) * 15 };
  it('hanya waktu yang diaktifkan, belum lewat, tanpa terbit', () => {
    const zuhur = slots(new Date(2026, 9, 2, 12), LOC).find((s) => s.key === 'zuhur')!;
    const a = prayerAlerts(new Date(zuhur.at.getTime() + 1000), LOC, { subuh: true, zuhur: true, maghrib: true }, 2);
    expect(a.map((x) => x.key)).toEqual(['maghrib', 'subuh', 'zuhur', 'maghrib']);
  });
});

describe('metode hitung', () => {
  const pt = jest.requireActual('@/features/reminders/prayerTimes') as typeof import('@/features/reminders/prayerTimes');
  it('autoMethod per wilayah', () => {
    expect(pt.autoMethod({ latitude: -6.2, longitude: 106.8 })).toBe('kemenag');
    expect(pt.autoMethod({ latitude: 3.14, longitude: 101.7 })).toBe('jakim');
    expect(pt.autoMethod({ latitude: 21.4, longitude: 39.8 })).toBe('makkah');
    expect(pt.autoMethod({ latitude: 40.7, longitude: -74 })).toBe('isna');
    expect(pt.autoMethod({ latitude: 51.5, longitude: -0.1 })).toBe('mwl');
    expect(pt.autoMethod({ latitude: 41, longitude: 29 })).toBe('diyanet');
  });
  it('Hanafi membuat Asar lebih lambat; Umm al-Qura Isya = Maghrib + 90 mnt', () => {
    const c = { latitude: 21.4, longitude: 39.8 };
    const std = pt.computePrayerTimes(2026, 10, 2, c, 3, { method: 'makkah' });
    const han = pt.computePrayerTimes(2026, 10, 2, c, 3, { method: 'makkah', hanafi: true });
    expect(han.asar).toBeGreaterThan(std.asar + 0.3);
    expect(std.isya - std.maghrib).toBeCloseTo(1.5, 5);
  });
  it('bawaan tetap Kemenag (kompatibel)', () => {
    const c = { latitude: -6.2, longitude: 106.8 };
    expect(pt.computePrayerTimes(2026, 10, 2, c, 7)).toEqual(pt.computePrayerTimes(2026, 10, 2, c, 7, { method: 'kemenag' }));
  });
});
