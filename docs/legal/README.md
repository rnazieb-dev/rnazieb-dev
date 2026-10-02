# Dokumen hukum & dukungan (donasi) NAFS

Sumber tunggal: `privacy.{en,id}.md`, `terms.{en,id}.md`, `config.json`. Dibangun dengan `npm run build:legal` (di `apps/esok`) menjadi:
- `apps/esok/src/content/legal.generated.json` → layar **Profil › Kebijakan Privasi / Syarat & Ketentuan** dan tautan di pengenalan.
- `site/index.html`, `site/privacy.html`, `site/terms.html` → halaman web publik (EN + ID).
CI menolak PR bila hasil bangun tidak mutakhir.

## Wajib sebelum rilis toko
1. Isi `config.json`: `operatorName`, `contactEmail` (alamat publik, bukan pribadi). Lalu `npm run build:legal:strict` harus lolos.
2. **Minta tinjauan konsultan hukum** (UU PDP No. 27/2022; GDPR bila ada pengguna UE/Inggris; hukum konsumen). Dokumen ini draf, bukan nasihat hukum.
3. Terbitkan `site/` di domain yang Anda kendalikan (GitHub Pages / Vercel / Cloudflare Pages). URL `…/privacy.html` dipakai untuk:
   - Google Play Console › Kebijakan Aplikasi (wajib), dan formulir **Data safety**.
   - App Store Connect › Privacy Policy URL, dan **App Privacy** (nutrition label).
4. Isi formulir Data safety / App Privacy sesuai kenyataan (lihat `docs/esok/PRIVASI.md`): tanpa iklan, tanpa analitik, lokasi tidak dikirim; data akun & konten grup bila cloud aktif; item privat E2EE.
5. Pastikan `delete_my_account()` berjalan dan ada tautan penghapusan akun di aplikasi (sudah: Profil › Akun & cloud) serta URL permintaan penghapusan web untuk Play Console bila diminta.

## Donasi / dukungan — aturan yang harus dipatuhi
Prinsip produk (sudah tertulis di layar & Syarat §6): sukarela; tidak membuka fitur; tidak mengubah poin/level/lencana/peringkat; bukan zakat; tanpa janji ganjaran; tanpa tekanan.

Aturan toko (periksa versi terbaru sebelum rilis):
- **Google Play**: menerima uang untuk konten/fitur digital di dalam aplikasi umumnya wajib lewat Google Play Billing. Tautan donasi eksternal untuk pengembang berisiko ditolak. Jika di build toko ingin tetap ada dukungan, gunakan **IAP "tip" sekali beli** (non-fitur) atau jangan tampilkan tombol di build toko.
- **Apple App Store**: donasi kepada pengembang/aplikasi lazimnya harus lewat IAP; tautan eksternal bisa ditolak (kecuali ketentuan wilayah tertentu yang membolehkan tautan keluar). Donasi untuk lembaga amal terdaftar punya jalur terpisah.
- Karena itu, tombol di `app/support.tsx` **tersembunyi sampai `EXPO_PUBLIC_DONATE_URL` diisi**. Rekomendasi: isi hanya untuk build web/APK sideload/GitHub, kosongkan untuk profil `production` toko, atau implementasikan IAP tip jar terlebih dahulu.
- Tempat menerima: gunakan platform yang menyediakan faktur/kepatuhan (mis. Trakteer, Saweria, Ko-fi, GitHub Sponsors, Open Collective). Pelajari kewajiban pajak (NPWP/PPh) penerima di negara Anda; bila membentuk badan/yayasan, pasang namanya di `operatorName`.
- Laporan transparansi singkat tahunan (pemasukan & pemakaian) direncanakan dan dijanjikan di layar — penuhi.
