/**
 * Penyimpanan lokal (SQLite + kunci vault) hanya satu per perangkat. Agar data satu akun tak pernah
 * terbaca/terkirim oleh akun lain, penyimpanan "diikat" ke akun yang pertama mengaktifkan cloud.
 */
export type BindingState = 'unbound' | 'same' | 'other';

export function bindingState(bound: string | null | undefined, userId: string): BindingState {
  if (!bound) return 'unbound';
  return bound === userId ? 'same' : 'other';
}

/** Sinkron hanya boleh bila belum terikat (akan diikat saat aktivasi) atau terikat ke akun yang sama. */
export function canSyncAs(bound: string | null | undefined, userId: string): boolean {
  return bindingState(bound, userId) !== 'other';
}

/** Data lokal boleh dipakai bila tak ada sesi (pemilik perangkat) atau sesi = pemilik ikatan / belum terikat. */
export function canUseLocalData(bound: string | null | undefined, userId: string | null | undefined): boolean {
  if (!userId) return true;
  return bindingState(bound, userId) !== 'other';
}
