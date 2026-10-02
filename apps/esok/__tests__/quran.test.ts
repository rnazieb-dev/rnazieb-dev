import { JUZ_START, TOTAL_VERSES, emptyQuranState, filterSurahs, globalIndex, juzOf, markRead, surahs, toggleBookmark, versesOf } from '@/features/quran/data';

describe('quran', () => {
  const list = surahs();
  const counts = list.map((s) => s.count);
  it('114 surah, 6236 ayat; Al-Fatihah 7 ayat dengan teks Arab & terjemah', () => {
    expect(list).toHaveLength(114);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(TOTAL_VERSES);
    const f = versesOf(1);
    expect(f).toHaveLength(7);
    expect(f[0]!.arabic).toContain('بِسۡمِ');
    expect(f[0]!.id).toMatch(/Allah/);
  });
  it('awal juz naik dan valid', () => {
    expect(JUZ_START).toHaveLength(30);
    for (let i = 1; i < 30; i++) expect(globalIndex(counts, ...JUZ_START[i]!)).toBeGreaterThan(globalIndex(counts, ...JUZ_START[i - 1]!));
    for (const [s, a] of JUZ_START) expect(a).toBeLessThanOrEqual(counts[s - 1]!);
    expect(juzOf(2, 141)).toBe(1);
    expect(juzOf(2, 142)).toBe(2);
    expect(juzOf(114, 6)).toBe(30);
  });
  it('indeks global & progres khatam (menyelesaikan putaran)', () => {
    expect(globalIndex(counts, 1, 1)).toBe(1);
    expect(globalIndex(counts, 114, 6)).toBe(TOTAL_VERSES);
    let s = markRead(emptyQuranState(), counts, 2, 5);
    expect(s.khatamFurthest).toBe(12);
    s = markRead(s, counts, 1, 3); // mundur tidak mengurangi progres
    expect(s.khatamFurthest).toBe(12);
    expect(s.last).toEqual({ surah: 1, ayah: 3 });
    s = markRead(s, counts, 114, 6);
    expect(s.khatamRound).toBe(1);
    expect(s.khatamFurthest).toBe(0);
  });
  it('cari surah & penanda', () => {
    expect(filterSurahs(list, 'yasin')[0]?.number).toBe(36);
    expect(filterSurahs(list, '112')[0]?.translit).toMatch(/Ikhlas/);
    let s = toggleBookmark(emptyQuranState(), 2, 255, 'x');
    expect(s.bookmarks).toHaveLength(1);
    s = toggleBookmark(s, 2, 255, 'y');
    expect(s.bookmarks).toHaveLength(0);
  });
});
