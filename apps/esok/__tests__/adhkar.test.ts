import { ADHKAR } from '@/content';
import { validateAdhkar } from '@/content/validate';
import { freshProgress, itemsFor, progressKey, suggestedTab, tap, toggleDone } from '@/features/adhkar/logic';

describe('dzikir & doa bersumber', () => {
  it('konten valid: ayat berteks Arab dari data Mushaf, doa hadis tanpa Arab manual', () => {
    expect(validateAdhkar(ADHKAR)).toEqual([]);
    const kursi = ADHKAR.find((a) => a.id === 'ad-kursi')!;
    expect(kursi.arabic).toMatch(/[؀-ۿ]/);
    expect(kursi.source).toContain('2:255');
    expect(ADHKAR.filter((a) => a.kind === 'hadith').every((a) => !a.arabic && /sahih|hasan/.test(a.grade))).toBe(true);
  });
  it('jumlah bacaan hanya bila ada dalilnya', () => {
    for (const a of ADHKAR.filter((x) => x.count)) expect(a.countSource).toBeTruthy();
    expect(validateAdhkar([{ ...ADHKAR[0]!, count: 3, countSource: undefined }]).join()).toMatch(/countSource/);
  });
  it('validator menolak Arab manual pada hadis & klaim keutamaan di catatan', () => {
    const h = ADHKAR.find((a) => a.kind === 'hadith')!;
    expect(validateAdhkar([{ ...h, arabic: 'x' }]).join()).toMatch(/Arab/);
    expect(validateAdhkar([{ ...h, note: 'dapat pahala besar' }]).join()).toMatch(/klaim keutamaan/);
  });
  it('tab pagi/petang memuat item gabungan; tab lain sesuai grup', () => {
    expect(itemsFor(ADHKAR, 'pagi').some((a) => a.id === 'ad-pagi')).toBe(true);
    expect(itemsFor(ADHKAR, 'pagi').some((a) => a.id === 'ad-petang')).toBe(false);
    expect(itemsFor(ADHKAR, 'petang').some((a) => a.id === 'ad-kursi')).toBe(true);
    expect(itemsFor(ADHKAR, 'tidur').every((a) => a.group === 'tidur')).toBe(true);
    for (const t of ['pagi', 'petang', 'tidur', 'harian', 'kematian'] as const) expect(itemsFor(ADHKAR, t).length).toBeGreaterThan(0);
  });
  it('tab yang disarankan menurut jam', () => {
    expect(suggestedTab(6)).toBe('pagi');
    expect(suggestedTab(15)).toBe('petang');
    expect(suggestedTab(22)).toBe('tidur');
    expect(suggestedTab(1)).toBe('tidur');
  });
  it('penghitung: ketuk menaikkan sampai target lalu selesai; tak melebihi target; pagi & petang terpisah', () => {
    const item = ADHKAR.find((a) => a.id === 'ad-bismillah-tiga')!;
    let p = freshProgress('2026-10-02');
    p = tap(p, 'pagi', item);
    p = tap(p, 'pagi', item);
    expect(p.done).not.toContain(progressKey('pagi', item.id));
    p = tap(p, 'pagi', item);
    p = tap(p, 'pagi', item);
    expect(p.counts[progressKey('pagi', item.id)]).toBe(3);
    expect(p.done).toContain(progressKey('pagi', item.id));
    expect(p.done).not.toContain(progressKey('petang', item.id));
    p = toggleDone(p, 'pagi', item);
    expect(p.done).not.toContain(progressKey('pagi', item.id));
  });
});
