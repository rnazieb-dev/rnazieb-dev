/**
 * Membangun src/content/quotes.generated.json.
 * Teks Arab & terjemah Al-Qur'an DIAMBIL dari paket `quran-json` (teks Utsmani,
 * terjemah Indonesia) berdasarkan rujukan "surah:ayat" — tidak diketik ulang.
 * Lisensi data: CC BY-SA 4.0 (lihat docs/esok/ATRIBUSI.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Quote } from '../src/content/types';

interface SourceItem {
  id: string;
  kind: 'quran' | 'hadith' | 'renungan';
  ref?: string;
  text?: string;
  source?: string;
  grade?: 'sahih' | 'hasan';
  note?: string;
  tone: Quote['tone'];
  theme: string;
}
interface Verse { id: number; text: string; translation: string }
interface Chapter { id: number; transliteration: string; verses: Verse[] }

const root = path.resolve(__dirname, '..');
const quranPath = path.join(root, 'node_modules/quran-json/dist/quran_id.json');
const chapters = JSON.parse(fs.readFileSync(quranPath, 'utf8')) as Chapter[];
const source = JSON.parse(
  fs.readFileSync(path.join(root, 'content/quotes.source.json'), 'utf8'),
) as SourceItem[];

function resolveQuran(ref: string): { arabic: string; text: string; source: string } {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) throw new Error(`Rujukan tidak valid: ${ref}`);
  const surah = Number(m[1]);
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  const chapter = chapters.find((c) => c.id === surah);
  if (!chapter) throw new Error(`Surah tidak ditemukan: ${ref}`);
  const verses = chapter.verses.filter((v) => v.id >= from && v.id <= to);
  if (verses.length !== to - from + 1) throw new Error(`Ayat tidak lengkap: ${ref}`);
  const range = to === from ? `${from}` : `${from}-${to}`;
  return {
    arabic: verses.map((v) => v.text).join(' '),
    text: verses.map((v) => v.translation).join(' '),
    source: `QS ${chapter.transliteration} ${surah}:${range}`,
  };
}

const out: Quote[] = source.map((s) => {
  if (s.kind === 'quran') {
    if (!s.ref) throw new Error(`Item Al-Qur'an tanpa ref: ${s.id}`);
    const r = resolveQuran(s.ref);
    return { id: s.id, kind: 'quran', tone: s.tone, theme: s.theme, arabic: r.arabic, text: r.text, source: r.source, grade: 'quran' };
  }
  const q: Quote = { id: s.id, kind: s.kind, tone: s.tone, theme: s.theme, text: s.text ?? '' };
  if (s.source) q.source = s.source;
  if (s.grade) q.grade = s.grade;
  if (s.note) q.note = s.note;
  return q;
});

fs.writeFileSync(path.join(root, 'src/content/quotes.generated.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`quotes.generated.json: ${out.length} item`);

// Misi: salin katalog sumber ke src agar ikut ter-bundle.
fs.copyFileSync(
  path.join(root, 'content/missions.source.json'),
  path.join(root, 'src/content/missions.generated.json'),
);
console.log('missions.generated.json disalin');
