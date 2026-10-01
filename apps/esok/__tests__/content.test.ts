import { MISSIONS, QUOTES } from '@/content';
import { validateMissions, validateQuotes } from '@/content/validate';
import { MAX_BODY } from '@/features/reminders/schedule';

describe('konten', () => {
  it('kutipan valid (sumber wajib, hadis hanya sahih/hasan)', () => {
    expect(validateQuotes(QUOTES)).toEqual([]);
  });
  it('misi valid (dalil wajib untuk ibadah/musiman, tanpa klaim pahala tak berdalil)', () => {
    expect(validateMissions(MISSIONS)).toEqual([]);
  });
  it('ayat memuat teks Arab dari data Mushaf dan sumber QS', () => {
    const q = QUOTES.find((x) => x.id === 'q-3-185');
    expect(q?.arabic).toMatch(/[؀-ۿ]/);
    expect(q?.source).toBe("QS Ali 'Imran 3:185");
  });
  it('distribusi nada seimbang dan cukup untuk rotasi notifikasi', () => {
    for (const tone of ['khauf', 'raja', 'amal'] as const) {
      const n = QUOTES.filter((q) => q.tone === tone && q.text.length <= MAX_BODY).length;
      expect(n).toBeGreaterThanOrEqual(6);
    }
  });
  it('katalog misi memenuhi cakupan', () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(60);
    for (const c of ['daily', 'weekly', 'seasonal', 'side']) expect(MISSIONS.some((m) => m.cadence === c)).toBe(true);
    expect(MISSIONS.filter((m) => m.canBeSecret).length).toBeGreaterThan(10);
    expect(MISSIONS.filter((m) => m.canBeShared).length).toBeGreaterThan(5);
  });
  it('validator menolak pelanggaran', () => {
    const bad = validateQuotes([
      { id: 'a', kind: 'hadith', tone: 'amal', theme: 't', text: 'x', source: 'HR. X', grade: 'quran' as never },
      { id: 'a', kind: 'renungan', tone: 'raja', theme: 't', text: 'y', source: 'HR. Z' },
    ]);
    expect(bad.join('\n')).toMatch(/sahih\/hasan/);
    expect(bad.join('\n')).toMatch(/id ganda/);
    expect(bad.join('\n')).toMatch(/renungan tidak boleh/);
    const m = validateMissions([
      { id: 'm', title: 't', description: 'dapat pahala besar', category: 'ibadah', cadence: 'daily', difficulty: 1, points: 6, dalil: null, canBeSecret: true, canBeShared: false, estimateMinutes: 5 },
    ]);
    expect(m.join('\n')).toMatch(/ibadah wajib berdalil/);
    expect(m.join('\n')).toMatch(/klaim pahala/);
  });
});
