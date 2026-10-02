import { QUOTES } from '@/content';
import { quoteOfDay } from '@/features/reminders/daily';

describe('kutipan hari ini', () => {
  it('deterministik dan nada berputar', () => {
    const a = quoteOfDay(QUOTES, '2026-10-01', 's');
    expect(quoteOfDay(QUOTES, '2026-10-01', 's').id).toBe(a.id);
    const tones = new Set(Array.from({ length: 9 }, (_, i) => quoteOfDay(QUOTES, `2026-10-${String(i + 1).padStart(2, '0')}`, 's').tone));
    expect(tones.size).toBe(3);
  });
  it('tanpa khauf bila dimatikan', () => {
    for (let i = 1; i <= 20; i++) expect(quoteOfDay(QUOTES, `2026-11-${String(i).padStart(2, '0')}`, 's', false).tone).not.toBe('khauf');
  });
});
