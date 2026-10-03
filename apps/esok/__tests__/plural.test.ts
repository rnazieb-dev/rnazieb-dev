import { pickPlural, pluralCategory } from '@/i18n/plural';

describe('aturan jamak CLDR', () => {
  it('Arab: nol, satu, dua, sedikit, banyak, lainnya', () => {
    const c = (n: number) => pluralCategory('ar', n);
    expect([0, 1, 2, 3, 10, 11, 99, 100, 102, 103, 111].map(c)).toEqual(['zero', 'one', 'two', 'few', 'few', 'many', 'many', 'other', 'other', 'few', 'many']);
  });
  it('Rusia: one/few/many', () => {
    const c = (n: number) => pluralCategory('ru', n);
    expect([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111].map(c)).toEqual(['one', 'few', 'few', 'many', 'many', 'many', 'many', 'one', 'few', 'many', 'one', 'many']);
  });
  it('Bosnia: one/few/other', () => {
    const c = (n: number) => pluralCategory('bs', n);
    expect([1, 2, 5, 11, 21, 24].map(c)).toEqual(['one', 'few', 'other', 'other', 'one', 'few']);
  });
  it('Inggris/Jerman/Prancis dan bahasa tanpa jamak', () => {
    expect([0, 1, 2].map((n) => pluralCategory('en', n))).toEqual(['other', 'one', 'other']);
    expect([0, 1, 2].map((n) => pluralCategory('fr', n))).toEqual(['one', 'one', 'other']);
    expect([0, 1, 2].map((n) => pluralCategory('id', n))).toEqual(['other', 'other', 'other']);
  });
  it('pickPlural jatuh ke other bila kategori tak ada', () => {
    expect(pickPlural({ one: 'satu', other: 'banyak' }, 'ru', 3)).toBe('banyak');
    expect(pickPlural({ one: 'satu', other: 'banyak' }, 'en', 1)).toBe('satu');
  });
});

describe('translate dengan bentuk jamak', () => {
  jest.mock('expo-localization', () => ({ getLocales: () => [] }));
  jest.mock('react-native', () => ({ I18nManager: { isRTL: false } }));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { translate } = require('@/i18n') as typeof import('@/i18n');
  it('Inggris: 1 vs banyak', () => {
    expect(translate('en', 'dhikr.readings', { n: 1 })).toBe('1 reading');
    expect(translate('en', 'dhikr.readings', { n: 5 })).toBe('5 readings');
  });
  it('Arab: 1, 2, 3, 11, 100', () => {
    expect(translate('ar', 'quran.verses', { n: 1 })).toBe('آية واحدة');
    expect(translate('ar', 'quran.verses', { n: 2 })).toBe('آيتان');
    expect(translate('ar', 'quran.verses', { n: 3 })).toBe('3 آيات');
    expect(translate('ar', 'quran.verses', { n: 11 })).toBe('11 آية');
    expect(translate('ar', 'quran.verses', { n: 100 })).toBe('100 آية');
  });
  it('Bosnia: bod/boda/bodova', () => {
    expect(translate('bs', 'groups.rank.points', { n: 1 })).toBe('1 bod');
    expect(translate('bs', 'groups.rank.points', { n: 3 })).toBe('3 boda');
    expect(translate('bs', 'groups.rank.points', { n: 7 })).toBe('7 bodova');
  });
  it('bahasa tanpa bentuk jamak memakai string biasa; bahasa yang kurang jatuh ke Inggris dengan aturan Inggris', () => {
    expect(translate('id', 'quran.verses', { n: 1 })).toBe('1 ayat');
    expect(translate('de', 'dhikr.readings', { n: 1 })).toBe('1 Text');
  });
});
