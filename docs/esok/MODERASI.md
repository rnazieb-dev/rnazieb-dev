# NAFS — Moderasi konten pengguna

Konten pengguna (feed, komentar, nama) hanya ada di dalam lingkaran tertutup.

- **Lapis 1 (klien)**: penyaring (`features/circles/moderation.ts`) menolak tautan, nomor telepon, dan kata kasar; panjang dibatasi (kiriman 280, komentar 200).
- **Lapis 2 (server)**: batas panjang & CHECK di Postgres; RLS memastikan hanya anggota aktif yang membaca/menulis; `join_circle` selalu butuh persetujuan admin dan dibatasi 10/hari; `send_nudge` dibatasi 3/hari per pasangan & 20/hari total.
- **Lapis 3 (manusia)**: admin lingkaran dapat menyembunyikan kiriman, menghapus komentar, mematikan komentar/peringkat, mengeluarkan anggota. Semua pengguna dapat **melaporkan** (`reports`) dan **memblokir** (dua arah).
- **Tindak lanjut laporan**: tabel `reports` hanya dibaca lewat service role (dasbor Supabase). Tetapkan SLA tinjauan (mis. 24 jam) dan kontak moderator di halaman toko aplikasi sebelum rilis.
- **Tidak ada**: foto, tautan, DM pribadi, pencarian pengguna publik, peringkat global.
