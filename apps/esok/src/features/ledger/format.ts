import { formatMoney, parseMoney } from '@/features/support/money';

/** Kompatibilitas: format rupiah lama ("Rp 1.500.000"). Layar memakai formatMoney dengan mata uang pilihan pengguna. */
export const formatRupiah = (n: number): string => formatMoney(n, 'IDR', 'id').replace(/^(-?)IDR/, '$1Rp');
export const parseRupiah = parseMoney;
