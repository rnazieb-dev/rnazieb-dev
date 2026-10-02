# NAFS — Privasi (draf kebijakan & model ancaman)

> Draf untuk ditinjau konsultan hukum (UU PDP No. 27/2022) sebelum rilis publik.

## Data apa, di mana
| Data | Lokal | Cloud (jika diaktifkan) | Dapat dibaca server? |
|---|---|---|---|
| Amalan rahasia, refleksi (niat/muhasabah) | Ciphertext (+ kolom `day/points/category/mission_id` lokal-saja untuk streak & skor pribadi) | Ciphertext + `rev` + stempel waktu **dikaburkan ke hari** | **Tidak** (E2EE) |
| Catatan utang/piutang/amanah/wasiat | Ciphertext (+ kolom lokal-saja `day`, `due_day`, `open` untuk pengingat jatuh tempo & hitungan di Beranda tanpa membuka vault) | Ciphertext + `rev` + stempel waktu hari | **Tidak** (E2EE) |
| Amal dibagikan (Lingkaran/Semua teman lingkaran) | Teks | Teks | Ya (agar teman dapat melihat) |
| Poin publik | — | `points_ledger` (hanya dari amal yang dibagikan, dibatasi 100/hari) | Ya |
| Profil (nama tampilan, preferensi peringkat/mode ikhlas) | Ya | Ya | Ya |
| Lokasi (waktu salat) | Dibulatkan 2 desimal, lokal | Tidak pernah dikirim | — |
| Kunci data (DEK) | `SecureStore` perangkat | Hanya terbungkus passphrase/kunci pemulihan | Tidak |

## Jaminan teknis (diuji otomatis)
- `private_items` hanya dapat diakses pemilik (RLS), tanpa view/FK/fungsi/trigger sosial (`__tests__/rls.test.ts`).
- Server hanya menerima kolom `id, kind, ciphertext, nonce, rev, updated_at(hari), deleted_at` untuk item rahasia (`__tests__/sync.test.ts`).
- Tabel `deeds` menolak visibilitas `secret` (CHECK di SQLite & Postgres).
- Level/streak publik tidak berubah karena amalan rahasia (`__tests__/db.test.ts`).

## Keterbatasan yang diakui
- Lupa passphrase **dan** kunci pemulihan = amalan rahasia di cloud tak dapat dipulihkan (disengaja).
- Metadata kasar (adanya item privat, jumlah, hari perubahan) terlihat server.
- Berkas ekspor JSON tidak terenkripsi.
- Cadangan perangkat (iCloud/Google) dapat memuat SQLite lokal; isi rahasia tetap ciphertext, tetapi kolom `day/points/category/due_day/open` lokal terbaca dari cadangan.
- Beranda menampilkan jumlah catatan jatuh tempo tanpa membuka vault (dari kolom lokal). Aktifkan kunci aplikasi bila perangkat dipakai bergantian.
- Notifikasi jatuh tempo memakai teks generik; judul/nama/nominal tidak pernah muncul di layar kunci.

## Hak pengguna
Ekspor (Profil › Keamanan & data), hapus data lokal, hapus akun (`delete_my_account()` menghapus seluruh baris lewat `ON DELETE CASCADE`).

## Anak
Fitur lingkaran/cloud dinonaktifkan bagi pengguna yang tidak mengonfirmasi usia 13+.
