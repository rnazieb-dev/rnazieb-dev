import { QUOTES } from '@/content';
import { computePrayerTimes, formatHour } from '@/features/reminders/prayerTimes';
import {
  DEFAULT_REMINDERS,
  MAX_BODY,
  MAX_SCHEDULED,
  buildSchedule,
  notificationBody,
  pickTimesForIntensity,
} from '@/features/reminders/schedule';

const base = { now: new Date(2026, 9, 1, 8, 0), today: '2026-10-01', quotes: QUOTES, recentlySeen: [] as string[], seed: 'u1' };

describe('jadwal pengingat', () => {
  it('tidak melewati batas notifikasi iOS & tidak menjadwalkan masa lalu', () => {
    const s = buildSchedule({ ...base, settings: { ...DEFAULT_REMINDERS, intensity: 'sering', windowDays: 30 } });
    expect(s.length).toBeLessThanOrEqual(MAX_SCHEDULED);
    expect(s.every((r) => r.at.getTime() > base.now.getTime())).toBe(true);
  });
  it('tidak mengulang kutipan dalam jendela', () => {
    const s = buildSchedule({ ...base, settings: { ...DEFAULT_REMINDERS, intensity: 'sering', windowDays: 7 } });
    const ids = s.map((r) => r.quoteId);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('nada seimbang: tidak ada khauf berturut-turut & isi tidak melebihi batas', () => {
    const s = buildSchedule({ ...base, settings: { ...DEFAULT_REMINDERS, intensity: 'sering', windowDays: 10 } });
    const tones = s.map((r) => QUOTES.find((q) => q.id === r.quoteId)!.tone);
    for (let i = 1; i < tones.length; i++) expect(tones[i] === 'khauf' && tones[i - 1] === 'khauf').toBe(false);
    expect(tones.filter((t) => t === 'khauf').length).toBeLessThan(tones.length / 2);
    for (const r of s) expect(QUOTES.find((q) => q.id === r.quoteId)!.text.length).toBeLessThanOrEqual(MAX_BODY);
  });
  it('allowKhauf=false menghilangkan kutipan nada khauf', () => {
    const s = buildSchedule({ ...base, settings: { ...DEFAULT_REMINDERS, allowKhauf: false } });
    expect(s.every((r) => QUOTES.find((q) => q.id === r.quoteId)!.tone !== 'khauf')).toBe(true);
  });
  it('dinonaktifkan → kosong; intensitas mengatur jumlah per hari', () => {
    expect(buildSchedule({ ...base, settings: { ...DEFAULT_REMINDERS, enabled: false } })).toEqual([]);
    expect(pickTimesForIntensity(['05:00', '12:00', '19:00'], 'ringan')).toHaveLength(1);
    expect(pickTimesForIntensity(['05:00', '12:00', '19:00'], 'sedang')).toHaveLength(2);
  });
  it('isi notifikasi menyertakan sumber', () => {
    const q = QUOTES.find((x) => x.id === 'h-tirmidzi-2307')!;
    expect(notificationBody(q)).toContain('HR. Tirmidzi no. 2307');
  });
});

describe('waktu salat (Kemenag, perkiraan)', () => {
  it('Jakarta 1 Okt 2026 masuk akal', () => {
    const t = computePrayerTimes(2026, 10, 1, { latitude: -6.2088, longitude: 106.8456 }, 7);
    const within = (h: number, lo: string, hi: string) => {
      const f = (s: string) => Number(s.split(':')[0]) + Number(s.split(':')[1]) / 60;
      expect(h).toBeGreaterThanOrEqual(f(lo));
      expect(h).toBeLessThanOrEqual(f(hi));
    };
    within(t.subuh, '04:15', '04:50');
    within(t.zuhur, '11:38', '11:58');
    within(t.asar, '14:45', '15:05');
    within(t.maghrib, '17:40', '18:00');
    within(t.isya, '18:50', '19:10');
    expect(formatHour(t.zuhur)).toMatch(/^11:\d\d$/);
  });
});
