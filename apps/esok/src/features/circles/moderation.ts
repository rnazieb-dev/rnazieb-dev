/** Penyaring ringan sisi klien (lapis pertama). Moderasi sebenarnya: laporan + admin grup + RLS. */
const BAD_WORDS = [
  'anjing', 'babi', 'bangsat', 'bajingan', 'kontol', 'memek', 'ngentot', 'tolol', 'goblok', 'idiot', 'brengsek', 'keparat', 'asu',
];

export interface TextCheck {
  ok: boolean;
  reason?: string;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function checkText(raw: string, maxLen: number, opts: { allowEmpty?: boolean } = {}): TextCheck {
  const text = raw.trim();
  if (!text) return opts.allowEmpty ? { ok: true } : { ok: false, reason: 'Teks tidak boleh kosong.' };
  if (text.length > maxLen) return { ok: false, reason: `Maksimal ${maxLen} karakter.` };
  const n = norm(text);
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|id|net|org|co|io|me|xyz|link)\b)/.test(n)) {
    return { ok: false, reason: 'Tautan tidak diperbolehkan agar grup tetap aman.' };
  }
  if (/(\+?\d[\s-]?){9,}/.test(n)) return { ok: false, reason: 'Jangan membagikan nomor telepon di grup.' };
  const words = n.split(/[^a-z0-9]+/);
  if (BAD_WORDS.some((w) => words.includes(w))) return { ok: false, reason: 'Gunakan bahasa yang santun.' };
  return { ok: true };
}

export function sanitizeDisplayName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 40) || 'Hamba Allah';
}

export const REACTIONS = [
  { kind: 'barakallah', label: 'Barakallahu fiik' },
  { kind: 'aamiin', label: 'Aamiin' },
] as const;

export const NUDGE_TEXT = {
  ingat: 'Sudahkah hari ini ada satu kebaikan kecil? Semangat, kita saling mengingatkan.',
  doa: 'Semoga Allah mudahkan urusanmu hari ini. Aamiin.',
} as const;

/** Susun pesan ajakan untuk dibagikan: mengajak, bukan memamerkan angka; tidak memuat amalan rahasia. */
export function inviteMessage(opts: { circleName?: string; code?: string; missionTitle?: string }): string {
  const parts: string[] = [];
  if (opts.missionTitle) parts.push(`Yuk ikut misi kebaikan: "${opts.missionTitle}".`);
  if (opts.circleName && opts.code) parts.push(`Gabung grup "${opts.circleName}" di aplikasi Esok dengan kode ${opts.code}.`);
  parts.push('Hari ini seakan esok tiada — mari berlomba dalam kebaikan.');
  return parts.join(' ');
}
