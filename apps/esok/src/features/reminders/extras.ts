import { type DayKey, addDays, fromDayKey } from '@/lib/dates';

export type AdhkarSlot = 'pagi' | 'petang';
export interface DatedReminder<K> {
  at: Date;
  kind: K;
}

/** Anggaran notifikasi terjadwal (iOS maks. 64): dzikir ≤ 10, jatuh tempo ≤ 6, sisanya kutipan. */
export const MAX_ADHKAR_SCHEDULED = 10;
export const MAX_DUE_SCHEDULED = 6;
export const TOTAL_SCHEDULED = 60;

export function quoteBudget(adhkarCount: number, dueCount: number): number {
  return Math.max(0, TOTAL_SCHEDULED - adhkarCount - dueCount);
}

const at = (day: DayKey, hhmm: string): Date => {
  const base = fromDayKey(day);
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h ?? 0, m ?? 0, 0, 0);
};

/** Pengingat dzikir pagi & petang untuk beberapa hari ke depan (melewati waktu yang sudah lampau). */
export function adhkarReminders(opts: {
  now: Date;
  today: DayKey;
  days: number;
  timesForDay: (day: DayKey) => [string, string];
}): DatedReminder<AdhkarSlot>[] {
  const out: DatedReminder<AdhkarSlot>[] = [];
  for (let d = 0; d < opts.days; d++) {
    const day = addDays(opts.today, d);
    const [pagi, petang] = opts.timesForDay(day);
    for (const [kind, t] of [['pagi', pagi], ['petang', petang]] as const) {
      const when = at(day, t);
      if (when.getTime() > opts.now.getTime() + 30_000) out.push({ at: when, kind });
      if (out.length >= MAX_ADHKAR_SCHEDULED) return out;
    }
  }
  return out;
}

/**
 * Pengingat jatuh tempo: pukul 08:00 pada hari jatuh tempo. Teks notifikasi GENERIK (tanpa nama/nominal)
 * agar tak bocor di layar kunci. `dueDays` berisi hari unik.
 */
export function dueReminders(opts: { now: Date; dueDays: readonly DayKey[]; hour?: string }): DatedReminder<'due'>[] {
  const out: DatedReminder<'due'>[] = [];
  for (const day of opts.dueDays) {
    const when = at(day, opts.hour ?? '08:00');
    if (when.getTime() > opts.now.getTime() + 30_000) out.push({ at: when, kind: 'due' });
    if (out.length >= MAX_DUE_SCHEDULED) break;
  }
  return out;
}
