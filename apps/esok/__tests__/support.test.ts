import { emergencyNumber, localCrisisLine } from '@/features/support/regions';
import { COMMON_CURRENCIES, defaultCurrency, formatMoney, parseMoney } from '@/features/support/money';
import { formatRupiah } from '@/features/ledger/format';

describe('nomor darurat', () => {
  it('menyediakan nomor per negara dan fallback 112 yang ditandai tidak pasti', () => {
    expect(emergencyNumber('US')).toEqual({ number: '911', known: true });
    expect(emergencyNumber('gb')).toEqual({ number: '999', known: true });
    expect(emergencyNumber('AU').number).toBe('000');
    expect(emergencyNumber('ZZ')).toEqual({ number: '112', known: false });
    expect(emergencyNumber(null).known).toBe(false);
  });
  it('saluran Kemenkes hanya untuk Indonesia', () => {
    expect(localCrisisLine('ID')?.dial).toBe('119');
    expect(localCrisisLine('MY')).toBeNull();
    expect(localCrisisLine(undefined)).toBeNull();
  });
});

describe('uang', () => {
  it('format sesuai bahasa & kompatibel dengan format rupiah lama', () => {
    expect(formatMoney(1500000, 'IDR', 'id')).toBe('IDR 1.500.000');
    expect(formatMoney(1500000, 'USD', 'en')).toBe('USD 1,500,000');
    expect(formatMoney(-2500, 'EUR', 'de')).toBe('-EUR 2.500');
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
  });
  it('parse & mata uang bawaan', () => {
    expect(parseMoney('1.500.000')).toBe(1500000);
    expect(parseMoney('abc')).toBeNull();
    expect(defaultCurrency('MY')).toBe('MYR');
    expect(defaultCurrency('ZZ')).toBe('USD');
    expect(defaultCurrency('ZZ', 'JPY')).toBe('JPY');
    expect(COMMON_CURRENCIES).toContain('IDR');
  });
});
