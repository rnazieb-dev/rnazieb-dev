import { checkText, inviteMessage, sanitizeDisplayName } from '@/features/circles/moderation';

describe('moderasi klien', () => {
  it('menolak kosong, terlalu panjang, tautan, nomor telepon, dan kata kasar', () => {
    expect(checkText('   ', 50).ok).toBe(false);
    expect(checkText('x'.repeat(51), 50).ok).toBe(false);
    expect(checkText('lihat https://evil.example', 100).ok).toBe(false);
    expect(checkText('kunjungi www.contoh.com', 100).ok).toBe(false);
    expect(checkText('hubungi 0812-3456-7890', 100).ok).toBe(false);
    expect(checkText('dasar goblok', 100).ok).toBe(false);
  });
  it('menerima teks santun & boleh kosong bila diizinkan', () => {
    expect(checkText('Barakallahu fiik, semangat!', 100)).toEqual({ ok: true });
    expect(checkText('', 100, { allowEmpty: true }).ok).toBe(true);
  });
  it('nama tampilan dibersihkan', () => {
    expect(sanitizeDisplayName('  A   B  ')).toBe('A B');
    expect(sanitizeDisplayName('   ')).toBe('Hamba Allah');
    expect(sanitizeDisplayName('x'.repeat(100))).toHaveLength(40);
  });
  it('pesan ajakan memuat ajakan, bukan angka/pamer', () => {
    const m = inviteMessage({ circleName: 'Keluarga', code: 'ABC123XYZ0', missionTitle: 'Kabari orang tua' });
    expect(m).toContain('ABC123XYZ0');
    expect(m).not.toMatch(/poin|level|peringkat|streak/i);
  });
});
