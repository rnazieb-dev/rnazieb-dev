import { QUOTES } from '@/content';
import {
  MAX_ADHKAR_SCHEDULED,
  MAX_DUE_SCHEDULED,
  TOTAL_SCHEDULED,
  adhkarReminders,
  dueReminders,
  quoteBudget,
} from '@/features/reminders/extras';
import { DEFAULT_REMINDERS, buildSchedule } from '@/features/reminders/schedule';

const now = new Date(2026, 9, 1, 8, 0);

describe('pengingat tambahan', () => {
  it('dzikir: dua per hari, tanpa waktu lampau, dibatasi anggaran', () => {
    const r = adhkarReminders({ now, today: '2026-10-01', days: 30, timesForDay: () => ['05:45', '16:30'] });
    expect(r.length).toBe(MAX_ADHKAR_SCHEDULED);
    expect(r.every((x) => x.at.getTime() > now.getTime())).toBe(true);
    expect(r[0]).toMatchObject({ kind: 'petang' }); // 05:45 hari ini sudah lewat
    expect(r.filter((x) => x.kind === 'pagi').length).toBe(5);
    expect(r.filter((x) => x.kind === 'petang').length).toBe(5);
  });
  it('jatuh tempo: 08:00 pada hari itu, lampau dilewati, dibatasi', () => {
    const days = ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
    const r = dueReminders({ now, dueDays: days });
    expect(r.length).toBe(MAX_DUE_SCHEDULED);
    expect(r[0]?.at.getDate()).toBe(2);
    expect(r.every((x) => x.at.getHours() === 8)).toBe(true);
  });
  it('anggaran total tidak melampaui batas iOS saat digabung dengan kutipan', () => {
    const adhkar = adhkarReminders({ now, today: '2026-10-01', days: 10, timesForDay: () => ['05:45', '16:30'] });
    const due = dueReminders({ now, dueDays: ['2026-10-02', '2026-10-03'] });
    const limit = quoteBudget(adhkar.length, due.length);
    const quotes = buildSchedule({ now, today: '2026-10-01', settings: { ...DEFAULT_REMINDERS, intensity: 'sering', windowDays: 30 }, quotes: QUOTES, recentlySeen: [], seed: 's', limit });
    expect(quotes.length).toBeLessThanOrEqual(limit);
    expect(quotes.length + adhkar.length + due.length).toBeLessThanOrEqual(TOTAL_SCHEDULED);
    expect(quoteBudget(100, 100)).toBe(0);
  });
});
