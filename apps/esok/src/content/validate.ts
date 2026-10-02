import type { Mission, Quote } from './types';

const TONES = ['khauf', 'raja', 'amal'];
const CATEGORIES = ['ibadah', 'keluarga', 'sedekah', 'ilmu', 'memaafkan', 'lingkungan', 'sosial', 'diri'];
const CADENCES = ['daily', 'weekly', 'seasonal', 'side'];
const SEASONS = ['jumat', 'ramadan', 'sepuluh_dzulhijjah', 'arafah', 'asyura', 'senin_kamis'];
const ALLOWED_GRADES = ['sahih', 'hasan', 'quran'];
const BANNED_WORDS = ['undian', 'hadiah acak', 'lotre', 'loot', 'jackpot'];

export function validateQuotes(quotes: Quote[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const q of quotes) {
    if (seen.has(q.id)) errors.push(`${q.id}: id ganda`);
    seen.add(q.id);
    if (!TONES.includes(q.tone)) errors.push(`${q.id}: tone tidak valid`);
    if (!q.text.trim()) errors.push(`${q.id}: teks kosong`);
    if (q.kind === 'quran') {
      if (!q.arabic) errors.push(`${q.id}: ayat tanpa teks Arab`);
      if (!q.source?.startsWith('QS ')) errors.push(`${q.id}: sumber ayat harus berformat "QS ..."`);
    }
    if (q.kind === 'hadith') {
      if (!q.source?.startsWith('HR.') && !q.source?.includes('HR.')) errors.push(`${q.id}: hadis tanpa sumber "HR."`);
      if (q.grade !== 'sahih' && q.grade !== 'hasan') errors.push(`${q.id}: hadis hanya boleh sahih/hasan`);
    }
    if (q.kind === 'renungan' && (q.source || q.grade)) {
      errors.push(`${q.id}: renungan tidak boleh mengaku bersumber dalil`);
    }
  }
  const tones = new Set(quotes.map((q) => q.tone));
  for (const t of TONES) if (!tones.has(t as Quote['tone'])) errors.push(`tidak ada kutipan bernada ${t}`);
  return errors;
}

export function validateMissions(missions: Mission[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const m of missions) {
    const id = m.id;
    if (seen.has(id)) errors.push(`${id}: id ganda`);
    seen.add(id);
    if (!CATEGORIES.includes(m.category)) errors.push(`${id}: kategori tidak valid`);
    if (!CADENCES.includes(m.cadence)) errors.push(`${id}: cadence tidak valid`);
    if (m.cadence === 'seasonal' && (!m.season || !SEASONS.includes(m.season))) errors.push(`${id}: musiman tanpa season valid`);
    if (m.cadence !== 'seasonal' && m.season) errors.push(`${id}: season hanya untuk musiman`);
    if (m.dalil && !ALLOWED_GRADES.includes(m.dalil.grade)) errors.push(`${id}: derajat dalil tidak diizinkan`);
    if (m.dalil && !m.dalil.source) errors.push(`${id}: dalil tanpa sumber`);
    if (m.cadence === 'seasonal' && !m.dalil) errors.push(`${id}: misi musiman wajib berdalil`);
    if (m.category === 'ibadah' && !m.dalil) errors.push(`${id}: misi ibadah wajib berdalil`);
    if (m.canBeShared && (m.minPeople ?? 0) < 2) errors.push(`${id}: misi bersama butuh minPeople >= 2`);
    const pts = m.points;
    const range: Record<number, [number, number]> = { 1: [5, 8], 2: [10, 15], 3: [20, 30] };
    const r = range[m.difficulty];
    if (!r || pts < r[0] || pts > r[1]) errors.push(`${id}: poin di luar rentang kesulitan`);
    const hay = `${m.title} ${m.description}`.toLowerCase();
    for (const w of BANNED_WORDS) if (hay.includes(w)) errors.push(`${id}: mengandung kata terlarang "${w}"`);
    if (!m.dalil && /pahala|ganjaran|surga/.test(hay)) errors.push(`${id}: klaim pahala tanpa dalil`);
  }
  return errors;
}
