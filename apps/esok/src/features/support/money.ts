/** Format & parse nominal tanpa bergantung pada Intl (Hermes). Angka disimpan tanpa satuan mata uang. */
export const COMMON_CURRENCIES = ['IDR', 'MYR', 'SGD', 'USD', 'EUR', 'GBP', 'TRY', 'SAR', 'AED', 'EGP', 'PKR', 'BDT', 'INR', 'NGN', 'KES', 'RUB', 'CNY'] as const;

const DOT_GROUPING = new Set(['id', 'tr', 'de', 'es', 'nl', 'bs', 'sq', 'az']);
const SPACE_GROUPING = new Set(['ru', 'kk', 'uz', 'fr']);

/** Mata uang bawaan dari wilayah perangkat. */
const REGION_CURRENCY: Record<string, string> = {
  ID: 'IDR', MY: 'MYR', SG: 'SGD', US: 'USD', GB: 'GBP', TR: 'TRY', SA: 'SAR', AE: 'AED', EG: 'EGP', PK: 'PKR', BD: 'BDT',
  IN: 'INR', NG: 'NGN', KE: 'KES', RU: 'RUB', CN: 'CNY', AU: 'AUD', CA: 'CAD', NZ: 'NZD', QA: 'QAR', KW: 'KWD', MA: 'MAD',
  DE: 'EUR', FR: 'EUR', NL: 'EUR', ES: 'EUR', IT: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
};

export function defaultCurrency(region: string | null | undefined, deviceCurrency?: string | null): string {
  return deviceCurrency || REGION_CURRENCY[(region ?? '').toUpperCase()] || 'USD';
}

export function formatMoney(n: number, currency: string, lang = 'en'): string {
  const sep = DOT_GROUPING.has(lang) ? '.' : SPACE_GROUPING.has(lang) ? ' ' : ',';
  const grouped = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return `${n < 0 ? '-' : ''}${currency} ${grouped}`;
}

/** Ambil bilangan bulat dari input bebas (pemisah ribuan apa pun). */
export function parseMoney(input: string): number | null {
  const digits = input.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}
