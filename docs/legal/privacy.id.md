# Kebijakan Privasi NAFS

> Draf untuk ditinjau konsultan hukum sebelum rilis publik. Berlaku sejak: {{EFFECTIVE_DATE}}.

## 1. Siapa kami
NAFS ("aplikasi", "kami") adalah pengingat Islami harian dan jurnal amal yang dikelola oleh {{OPERATOR}}. Kontak: {{CONTACT}}. Kebijakan ini menjelaskan data apa yang diproses aplikasi dan pilihan Anda. Disusun dengan mengacu pada UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022) dan, bila berlaku, GDPR UE/Inggris serta hukum sejenis.

## 2. Ringkasnya
- Aplikasi berjalan **tanpa internet dan tanpa akun**. Jurnal, amalan rahasia, refleksi, dan catatan Anda tetap di perangkat.
- **Amalan rahasia, refleksi, dan catatan utang/amanah/wasiat dienkripsi ujung-ke-ujung** sebelum keluar dari perangkat. Kami tidak dapat membacanya.
- **Tanpa iklan**, **tanpa SDK analitik/pelacak**, dan kami **tidak menjual** data Anda.
- **Lokasi** hanya dipakai di perangkat untuk menghitung waktu salat dan kiblat. Dibulatkan sekitar 1 km dan **tidak pernah dikirim ke kami**.
- Fitur cloud (grup) bersifat opsional dan membutuhkan akun.

## 3. Data yang kami proses
**Hanya di perangkat (tanpa akun)**
- Catatan jurnal, misi, poin dan rangkaian hari, refleksi, catatan utang/amanah/wasiat, progres dzikir dan bacaan Al-Qur'an, penanda, pengaturan.
- Perkiraan lokasi (2 desimal) dan nama tempat dari ponsel Anda, untuk waktu salat dan kiblat.
- Item rahasia dan privat disimpan terenkripsi. Beberapa kolom non-isi (hari, poin, kategori, tanggal jatuh tempo) disimpan tanpa enkripsi di perangkat agar rangkaian hari, pengingat, dan Beranda berfungsi tanpa membuka vault. Cadangan perangkat (iCloud/Google) dapat memuat basis data lokal ini.

**Bila Anda mengaktifkan cloud dan grup (opsional)**
- Data akun: alamat email atau pengenal masuk, nama tampilan, preferensi (tampil di peringkat, mode ikhlas).
- Konten yang Anda pilih bagikan ke grup: teks amal, reaksi, komentar, kontribusi tantangan, dan poin publik yang dihasilkan.
- Item privat terenkripsi (ciphertext, nomor revisi, dan stempel waktu tingkat hari). Server tidak dapat mendekripsinya. Metadata kasar, seperti adanya, jumlah, dan hari perubahan item privat, terlihat oleh server.
- Bila Anda mengaktifkan notifikasi grup: token push perangkat. Isi notifikasi hanya nama pengirim dan teks baku.
- Laporan dan blokir yang Anda buat.

**Yang tidak kami kumpulkan**: kontak, foto, mikrofon, ID iklan, lokasi presisi, riwayat penelusuran, atau data kartu pembayaran.

## 4. Dasar dan tujuan pemrosesan
- Menyediakan fitur yang Anda minta (pelaksanaan layanan).
- **Persetujuan** Anda untuk fitur cloud, berbagi ke grup, lokasi, dan notifikasi yang bersifat opsional. Persetujuan dapat ditarik kapan saja di aplikasi.
- Keamanan dan kewajiban hukum, misalnya menangani laporan dan penyalahgunaan.

Informasi tentang praktik keagamaan bersifat sensitif. Kami memprosesnya hanya untuk menyediakan aplikasi kepada Anda, tidak pernah untuk profiling atau iklan.

## 5. Dengan siapa data dibagikan
- **Penyedia hosting/basis data** (Supabase) menyimpan data cloud bila Anda mengaktifkan cloud.
- **Pengiriman push** (layanan notifikasi push Expo) hanya bila Anda mengaktifkan notifikasi grup.
- **Anggota grup** melihat apa yang Anda pilih bagikan ke grup itu.
- Otoritas bila diwajibkan hukum.
Kami tidak menjual data pribadi atau membagikannya untuk iklan. Toko aplikasi (Google Play, Apple App Store) memproses data mereka sendiri sesuai kebijakan masing-masing.

## 6. Transfer lintas negara
Data cloud dapat diproses di server di luar negara Anda. Kami menerapkan perlindungan kontraktual bila dipersyaratkan hukum.

## 7. Penyimpanan dan penghapusan
- Data lokal tersimpan hingga Anda menghapusnya atau mencopot aplikasi (Profil › Keamanan & data).
- Data cloud disimpan selama akun ada. **Hapus akun** di aplikasi menghapus data cloud Anda (hapus berantai). Cadangan dihapus dalam jangka waktu wajar.
- Laporan yang diperlukan untuk menjaga keamanan komunitas dapat disimpan terbatas setelah penghapusan sejauh diizinkan hukum.

## 8. Hak Anda
Anda dapat mengakses dan mengekspor data (ekspor JSON di aplikasi), memperbaiki profil, menghapus data lokal, menghapus akun, menarik persetujuan, dan berkeberatan atas pemrosesan. Sesuai negara Anda, Anda juga dapat berhak membatasi pemrosesan, portabilitas data, dan mengadu ke otoritas pelindungan data (di Indonesia: lembaga PDP; di UE/Inggris: otoritas pengawas Anda). Hubungi kami di {{CONTACT}}; kami berupaya membalas dalam 30 hari.

## 9. Keamanan
Enkripsi ujung-ke-ujung (XChaCha20-Poly1305, kunci dibungkus Argon2id dari passphrase dan kunci pemulihan), kunci disimpan di penyimpanan aman perangkat, kontrol akses tingkat baris di server, kunci aplikasi opsional dengan biometrik, dan perlindungan tangkapan layar pada layar rahasia.
**Penting:** bila Anda kehilangan passphrase **dan** kunci pemulihan, item rahasia di cloud **tidak dapat dipulihkan**. Berkas ekspor JSON **tidak terenkripsi** — simpan dengan aman.

## 10. Anak
Aplikasi ditujukan bagi pengguna berusia **13 tahun ke atas** (atau usia lebih tinggi yang dipersyaratkan di negara Anda). Pengguna di bawah 13 tahun dapat memakai fitur pribadi dengan pendampingan orang tua, tetapi grup dan cloud dinonaktifkan kecuali usia dikonfirmasi. Bila Anda yakin ada anak memakai fitur cloud tanpa izin, hubungi kami dan data akan kami hapus.

## 11. Dukungan sukarela
Jika Anda memilih mendukung aplikasi, pembayaran diproses penyedia eksternal sesuai syarat dan kebijakan privasinya. Kami tidak menerima data kartu Anda. Dukungan tidak pernah membuka fitur atau mengubah poin, level, maupun peringkat.

## 12. Perubahan
Kebijakan ini dapat diperbarui. Perubahan penting akan diumumkan di aplikasi dan tanggal berlaku di atas akan berubah.

## 13. Kontak
{{OPERATOR}} — {{CONTACT}}
