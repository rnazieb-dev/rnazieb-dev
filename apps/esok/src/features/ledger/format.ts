/** "Rp 1.500.000" tanpa bergantung pada Intl (Hermes). */
export function formatRupiah(n: number): string {
  const s = String(Math.round(Math.abs(n)));
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}Rp ${grouped}`;
}

/** Ambil angka rupiah dari input bebas ("1.500.000", "Rp 1,5jt" tidak didukung → null). */
export function parseRupiah(input: string): number | null {
  const digits = input.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}
