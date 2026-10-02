import type { Quote, Tone } from '@/content/types';
import { type DayKey, addDays, fromDayKey } from '@/lib/dates';
import { hashString, seededRng, shuffled } from '@/lib/random';

export type Intensity = 'ringan' | 'sedang' | 'sering';

export interface ReminderSettings {
  enabled: boolean;
  /** Waktu tetap "HH:MM" (mode 'tetap'). */
  times: string[];
  intensity: Intensity;
  /** Jendela penjadwalan ke depan (hari). iOS membatasi 64 notifikasi terjadwal. */
  windowDays: number;
  /** Proporsi nada: tidak menakut-nakuti terus-menerus. */
  allowKhauf: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  times: ['05:00', '15:45', '19:45'],
  intensity: 'sedang',
  windowDays: 10,
  allowKhauf: true,
};

export const MAX_SCHEDULED = 60;
/** Panjang maksimum isi notifikasi agar terbaca utuh. */
export const MAX_BODY = 220;

export interface ScheduledReminder {
  at: Date;
  quoteId: string;
}

const PER_DAY: Record<Intensity, number> = { ringan: 1, sedang: 2, sering: 3 };

/** Pola nada seimbang: khauf tidak berturut-turut, raja' & amal mendominasi. */
const TONE_CYCLE: Tone[] = ['amal', 'raja', 'khauf', 'amal', 'raja', 'amal'];

function parseTime(t: string): [number, number] {
  const [h, m] = t.split(':').map(Number);
  return [Math.min(23, Math.max(0, h ?? 0)), Math.min(59, Math.max(0, m ?? 0))];
}

export function pickTimesForIntensity(times: string[], intensity: Intensity): string[] {
  const n = PER_DAY[intensity];
  if (times.length <= n) return times;
  // Ambil waktu tersebar merata dari daftar yang ada.
  const sorted = [...times].sort();
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(sorted[Math.floor((i * sorted.length) / n)] as string);
  return out;
}

/**
 * Susun jadwal pengingat: nada diputar seimbang, tidak mengulang kutipan dalam
 * jendela yang sama (selama stok cukup), kutipan yang baru dilihat dihindari.
 */
export function buildSchedule(opts: {
  now: Date;
  today: DayKey;
  settings: ReminderSettings;
  quotes: readonly Quote[];
  recentlySeen: readonly string[];
  seed: string;
  /** Waktu per hari (mis. berbasis waktu salat). Bawaan: settings.times. */
  timesForDay?: (day: DayKey) => string[];
  /** Batas jumlah kutipan terjadwal (anggaran notifikasi dibagi dengan dzikir & jatuh tempo). */
  limit?: number;
}): ScheduledReminder[] {
  const { now, today, settings, quotes, recentlySeen, seed } = opts;
  const limit = opts.limit ?? MAX_SCHEDULED;
  if (!settings.enabled) return [];
  const usable = quotes.filter((q) => q.text.length <= MAX_BODY && (settings.allowKhauf || q.tone !== 'khauf'));
  if (usable.length === 0) return [];
  const rng = seededRng(hashString(`sched|${today}|${seed}`));
  const seen = new Set(recentlySeen);
  const byTone = (tone: Tone) =>
    shuffled(
      usable.filter((q) => q.tone === tone),
      rng,
    ).sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)));
  const pools: Record<Tone, Quote[]> = { khauf: byTone('khauf'), raja: byTone('raja'), amal: byTone('amal') };
  const used = new Set<string>();

  const takeFrom = (tone: Tone): Quote | undefined => {
    const order: Tone[] = [tone, 'amal', 'raja', 'khauf'];
    for (const t of order) {
      const q = pools[t].find((x) => !used.has(x.id));
      if (q) return q;
    }
    return usable[Math.floor(rng() * usable.length)];
  };

  const out: ScheduledReminder[] = [];
  let cycle = 0;
  for (let d = 0; d < settings.windowDays; d++) {
    const dayKey = addDays(today, d);
    const base = fromDayKey(dayKey);
    const times = pickTimesForIntensity(opts.timesForDay ? opts.timesForDay(dayKey) : settings.times, settings.intensity);
    for (const t of times) {
      const [h, m] = parseTime(t);
      const at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
      if (at.getTime() <= now.getTime() + 30_000) continue;
      const wanted = TONE_CYCLE[cycle % TONE_CYCLE.length] as Tone;
      cycle++;
      const q = takeFrom(wanted);
      if (!q) continue;
      used.add(q.id);
      out.push({ at, quoteId: q.id });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function notificationBody(q: Quote): string {
  const src = q.source ? ` — ${q.source}` : '';
  const text = q.kind === 'quran' ? `"${q.text}"` : q.text;
  return `${text}${src}`.slice(0, 400);
}
