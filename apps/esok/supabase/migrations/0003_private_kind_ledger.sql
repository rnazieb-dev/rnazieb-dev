-- Tambah jenis item privat 'ledger' (utang/piutang/amanah/wasiat) — tetap ciphertext E2EE.
-- Tidak ada perubahan RLS/fungsi: private_items tetap hanya dapat diakses pemilik.
alter table public.private_items drop constraint private_items_kind_check;
alter table public.private_items
  add constraint private_items_kind_check check (kind in ('deed','reflection','ledger'));
