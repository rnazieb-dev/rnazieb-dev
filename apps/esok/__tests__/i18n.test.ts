import { LANGUAGES } from '@/i18n';

// babel-jest mengangkat jest.mock ke atas berkas, jadi aman diletakkan setelah import.
jest.mock('expo-localization', () => ({ getLocales: () => [] }));
jest.mock('react-native', () => ({ I18nManager: { isRTL: false } }));

type Tree = { [k: string]: unknown };
function leaves(o: unknown, prefix = ''): Map<string, string | string[]> {
  const out = new Map<string, string | string[]>();
  if (typeof o === 'string' || Array.isArray(o)) out.set(prefix, o as string);
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o as Tree)) for (const [kk, vv] of leaves(v, prefix ? `${prefix}.${k}` : k)) out.set(kk, vv);
  return out;
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

const en = leaves(LANGUAGES.en.dict);

describe.each(Object.keys(LANGUAGES).filter((l) => l !== 'en'))('kamus %s', (code) => {
  const d = leaves(LANGUAGES[code as keyof typeof LANGUAGES].dict);
  it('memiliki kunci yang sama dengan en', () => {
    expect([...d.keys()].sort()).toEqual([...en.keys()].sort());
  });
  it('mempertahankan placeholder & panjang daftar', () => {
    for (const [k, v] of en) {
      const x = d.get(k)!;
      if (Array.isArray(v)) expect((x as string[]).length).toBe(v.length);
      else expect(`${k}:${placeholders(x as string)}`).toBe(`${k}:${placeholders(v)}`);
    }
  });
  it('tidak ada teks kosong', () => {
    for (const [k, v] of d) if (!Array.isArray(v)) expect(`${k}:${v.trim().length > 0}`).toBe(`${k}:true`);
  });
});
