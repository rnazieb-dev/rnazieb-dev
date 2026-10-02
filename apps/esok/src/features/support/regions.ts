/**
 * Nomor darurat & bantuan per negara. Hanya nomor yang dikenal luas; selalu diberi pengingat
 * untuk memeriksa nomor setempat. Direktori saluran bantuan global: findahelpline.com (IASP).
 * DAFTAR INI WAJIB DIVERIFIKASI ULANG sebelum rilis (nomor dapat berubah).
 */
export const FIND_A_HELPLINE_URL = 'https://findahelpline.com';

/** Nomor darurat umum (polisi/ambulans) per kode negara ISO 3166-1 alpha-2. */
const EMERGENCY: Record<string, string> = {
  // 112 (EU & lainnya)
  AT: '112', BE: '112', BG: '112', HR: '112', CY: '112', CZ: '112', DK: '112', EE: '112', FI: '112', FR: '112',
  DE: '112', GR: '112', HU: '112', IE: '112', IT: '112', LV: '112', LT: '112', LU: '112', MT: '112', NL: '112',
  PL: '112', PT: '112', RO: '112', SK: '112', SI: '112', ES: '112', SE: '112', AL: '112', BA: '112', XK: '112',
  TR: '112', RU: '112', ID: '112', IN: '112', NG: '112', ZA: '112', KR: '112', UA: '112', AZ: '112', GE: '112',
  KZ: '112', UZ: '102',
  // 911
  US: '911', CA: '911', PH: '911', SA: '911', MX: '911',
  // 999
  GB: '999', MY: '999', SG: '999', BD: '999', AE: '999', KE: '999', HK: '999', QA: '999', KW: '999', OM: '999', BH: '999',
  // lainnya
  AU: '000', NZ: '111', JP: '110', CN: '110', TH: '191', EG: '122', PK: '15', LK: '119', NP: '100', MA: '19', DZ: '17', TN: '197',
};

export const DEFAULT_EMERGENCY = '112';

export function emergencyNumber(region: string | null | undefined): { number: string; known: boolean } {
  const r = (region ?? '').toUpperCase();
  const n = EMERGENCY[r];
  return n ? { number: n, known: true } : { number: DEFAULT_EMERGENCY, known: false };
}

/** Saluran bantuan psikologis resmi yang dikonfirmasi per negara (selain direktori global). */
export function localCrisisLine(region: string | null | undefined): { number: string; dial: string; label: 'kemenkes' } | null {
  if ((region ?? '').toUpperCase() === 'ID') return { number: '119 ext. 8', dial: '119', label: 'kemenkes' };
  return null;
}
