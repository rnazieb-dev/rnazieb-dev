import type { Quote } from '@/content/types';
import { hashString } from '@/lib/random';

/** Kutipan hari ini: deterministik per hari+pengguna, nada berputar (amal → raja → khauf → amal ...). */
export function quoteOfDay(quotes: readonly Quote[], day: string, seed: string, allowKhauf = true): Quote {
  const order = allowKhauf ? (['amal', 'raja', 'khauf'] as const) : (['amal', 'raja'] as const);
  const h = hashString(`qod|${day}|${seed}`);
  const dayIndex = Math.floor(new Date(`${day}T12:00:00Z`).getTime() / 86400000);
  const tone = order[dayIndex % order.length] as Quote['tone'];
  const pool = quotes.filter((q) => q.tone === tone);
  const list = pool.length ? pool : quotes;
  return list[h % list.length] as Quote;
}
