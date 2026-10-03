/** Bentuk jamak (aturan CLDR) untuk bahasa yang didukung. Kunci teks boleh berupa string atau objek PluralForms. */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export const isPluralForms = (v: unknown): v is PluralForms =>
  !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as { other?: unknown }).other === 'string';

/** Kategori jamak CLDR untuk bilangan bulat n ≥ 0 pada bahasa `lang`. */
export function pluralCategory(lang: string, nIn: number): PluralCategory {
  const n = Math.abs(Math.trunc(nIn));
  const m10 = n % 10;
  const m100 = n % 100;
  switch (lang) {
    // tanpa pembedaan jamak
    case 'id': case 'ms': case 'zh': case 'th': case 'yo':
      return 'other';
    case 'ar':
      if (n === 0) return 'zero';
      if (n === 1) return 'one';
      if (n === 2) return 'two';
      if (m100 >= 3 && m100 <= 10) return 'few';
      if (m100 >= 11 && m100 <= 99) return 'many';
      return 'other';
    case 'ru':
      if (m10 === 1 && m100 !== 11) return 'one';
      if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'few';
      return 'many';
    case 'bs':
      if (m10 === 1 && m100 !== 11) return 'one';
      if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'few';
      return 'other';
    case 'fr': case 'hi': case 'bn': case 'fa':
      return n === 0 || n === 1 ? 'one' : 'other';
    default:
      // en, de, nl, es, tr, az, uz, kk, sq, sw, ha, so, ur, ps, tl
      return n === 1 ? 'one' : 'other';
  }
}

/** Pilih bentuk; jatuh ke `other` bila kategori tidak tersedia. */
export function pickPlural(forms: PluralForms, lang: string, n: number): string {
  return forms[pluralCategory(lang, n)] ?? forms.other;
}
