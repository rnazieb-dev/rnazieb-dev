# NAFS — Produk

**NAFS** adalah aplikasi Android & iOS (Expo/React Native + TypeScript) pengingat kematian (dzikrul maut) dan jurnal/permainan kebaikan harian: *"hari ini seakan esok tiada"*.

## Fitur
- **Pengingat**: notifikasi lokal terjadwal (jam tetap atau mengikuti waktu salat), kutipan ayat/hadis bersumber dengan nada `khauf/raja/amal` yang seimbang (nada peringatan tak pernah berturut-turut). Tanpa hitung mundur/prediksi ajal.
- **Bekal hari ini**: checklist tanpa prediksi usia (taubat, maaf, orang tua, utang, wasiat, sedekah) + tautan bantuan (Kemenkes 119 ext. 8, darurat 112).
- **Dzikir & doa** (`/adhkar`): 20 item bersumber (pagi, petang, tidur/bangun, doa harian, ziarah & musibah). Teks Arab hanya untuk ayat Al-Qur'an (dari data Mushaf); doa dari hadis memuat terjemah + sumber + derajat. Jumlah bacaan hanya bila disebut dalil. **Tanpa poin/peringkat**; pengingat opsional.
- **Utang, amanah & wasiat** (`/ledger`): catatan utang, piutang, amanah, dan wasiat; terenkripsi E2EE seperti amalan rahasia (`private_items` kind `ledger`), pengingat jatuh tempo bernada generik (tanpa nama/nominal), tidak dihitung sebagai amal/poin.
- **Jurnal**: niat pagi → catat amal → muhasabah malam. Visibilitas per entri: **Rahasia (bawaan)**, Lingkaran, Semua teman lingkaran.
- **Amalan rahasia**: terenkripsi E2EE; tak pernah masuk feed, peringkat, kartu ajakan, push, atau agregat server.
- **Misi**: harian (3), mingguan (2), musiman (Jumat, Senin–Kamis, Ramadan, 10 Dzulhijjah, Arafah, Asyura), side quest kejutan (jenis misi acak, **bukan undian hadiah**).
- **Lingkaran** (keluarga/sesama jenis/terbuka): feed bermoderasi, reaksi baku, komentar terbatas, tantangan kolektif, misi bersama dengan konfirmasi sejawat, saling mengingatkan & mengirim doa (dibatasi laju), peringkat top-10 opsional.
- **Gamifikasi yang disehatkan**: poin = penanda konsistensi (bukan pahala), level netral, lencana deskriptif, streak lembut dengan hari uzur, "mode ikhlas" (menyembunyikan angka).
- **Privasi & akun**: kunci aplikasi (biometrik/PIN), ekspor JSON, hapus data lokal, hapus akun total, passphrase + kunci pemulihan.

## Yang sengaja tidak ada
Hitung mundur kematian · peringkat global · lencana/gelar bernuansa keagamaan · loot box/hadiah acak · transaksi uang (zakat/sedekah diarahkan ke lembaga resmi) · foto bukti amal (menjaga martabat penerima) · tautan di feed.

## Arsitektur singkat
- App: `apps/esok` — Expo SDK 57, expo-router, TypeScript strict, SQLite lokal (`expo-sqlite`), offline-first.
- Backend opsional: Supabase (Auth, Postgres + RLS, Edge Function push). Skema di `apps/esok/supabase/migrations`.
- Sinkronisasi: UUID + `updated_at`/`rev` + soft delete; push via RPC (LWW di server), pull via cursor `synced_at`.
- E2EE: DEK acak 256-bit; dibungkus passphrase (Argon2id) dan kunci pemulihan; item dienkripsi XChaCha20-Poly1305 dengan AAD `kind|id`.
