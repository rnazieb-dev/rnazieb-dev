import type { Adhkar, AdhkarGroup } from '@/content/types';

export type AdhkarTab = 'pagi' | 'petang' | 'tidur' | 'harian' | 'kematian';

export const TAB_LABEL: Record<AdhkarTab, string> = {
  pagi: 'Pagi',
  petang: 'Petang',
  tidur: 'Tidur & bangun',
  harian: 'Doa harian',
  kematian: 'Ziarah & musibah',
};

export const TABS = Object.keys(TAB_LABEL) as AdhkarTab[];

/** Pagi = sebelum tengah hari; selebihnya petang. (Hanya saran tampilan, bukan penentu waktu ibadah.) */
export function suggestedTab(hour: number): AdhkarTab {
  if (hour >= 21 || hour < 3) return 'tidur';
  return hour < 12 ? 'pagi' : 'petang';
}

export function itemsFor(all: readonly Adhkar[], tab: AdhkarTab): Adhkar[] {
  const groups: AdhkarGroup[] =
    tab === 'pagi' ? ['pagi', 'pagi_petang'] : tab === 'petang' ? ['petang', 'pagi_petang'] : [tab];
  return all.filter((a) => groups.includes(a.group));
}

export interface AdhkarProgress {
  day: string;
  done: string[];
  counts: Record<string, number>;
}

/** Progres harian per tab: kunci "tab:id" agar pagi & petang terhitung terpisah. Tidak ada poin. */
export const progressKey = (tab: AdhkarTab, id: string) => `${tab}:${id}`;

export function freshProgress(day: string): AdhkarProgress {
  return { day, done: [], counts: {} };
}

export function tap(p: AdhkarProgress, tab: AdhkarTab, item: Adhkar): AdhkarProgress {
  const k = progressKey(tab, item.id);
  const target = item.count ?? 1;
  const n = Math.min(target, (p.counts[k] ?? 0) + 1);
  const done = n >= target ? [...new Set([...p.done, k])] : p.done.filter((x) => x !== k);
  return { ...p, counts: { ...p.counts, [k]: n }, done };
}

export function toggleDone(p: AdhkarProgress, tab: AdhkarTab, item: Adhkar): AdhkarProgress {
  const k = progressKey(tab, item.id);
  if (p.done.includes(k)) return { ...p, done: p.done.filter((x) => x !== k), counts: { ...p.counts, [k]: 0 } };
  return { ...p, done: [...p.done, k], counts: { ...p.counts, [k]: item.count ?? 1 } };
}
