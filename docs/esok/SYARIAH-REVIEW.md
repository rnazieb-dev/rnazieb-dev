# Esok — Daftar tinjauan syar'i (WAJIB sebelum rilis publik)

Pengembang bukan ahli fikih. Semua konten keagamaan **harus ditinjau ustadz/dewan syariah** dan ditakhrij ulang dari kitab primer.

## 1. Kutipan (`content/quotes.source.json`)
- Teks Arab & terjemah Indonesia ayat diambil otomatis dari data Mushaf (`quran-json`: teks Utsmani QuranEnc, terjemah Kemenag RI). Verifikasi dengan Mushaf Standar Indonesia/lajnah.
- Hadis: nomor & derajat ditulis dari ingatan pengembang (Bukhari, Muslim, Tirmidzi, Ahmad, Al-Hakim). **Periksa setiap nomor** (mis. HR. Muslim no. 977, HR. Tirmidzi no. 2307, HR. Ahmad & Silsilah Shahihah no. 9, Shahih Al-Jami' no. 1077) dan derajatnya.
- `h-bukhari-6416-atsar` adalah perkataan Ibnu Umar (mauquf) — ditandai di UI.
- Kategori nada (`khauf/raja/amal`) dan "renungan" (non-nash) perlu ditinjau agar tidak terkesan hukum.

## 2. Misi (`content/missions.source.json`)
- Setiap misi ibadah/musiman wajib berdalil (validator). Periksa nomor ayat/hadis yang ditulis (mis. QS 73:20, 13:28, 71:10, 33:56, 4:103, 14:41, 4:86, 58:11, 54:17, 7:31, 59:18, 3:134, 2:186, 17:79, 2:185, 97:3, 22:28, 2:280).
- Nomor hadis yang perlu dicek ulang: Bukhari 1896 & Muslim 1152 (Ar-Rayyan), Tirmidzi 747 & 807, Bukhari 969, Muslim 1162.
- Misi 10 Dzulhijjah/Arafah/Asyura memakai kalender tabular (perkiraan); UI menyarankan mengikuti penetapan resmi.
- Ziarah kubur: tinjau ketentuan bagi perempuan sesuai mazhab/otoritas setempat.
- Tidak ada misi dengan klaim keutamaan tanpa dalil, dzikir berhitung dengan klaim pahala, atau ritual tanggal khusus tanpa dasar.

## 3. Desain produk
- Poin/lencana/level: penanda konsistensi, **bukan pahala** (teks ada di onboarding, profil, tentang). Tidak ada gelar keagamaan.
- Pamer/peringkat: opsional per lingkaran & per orang, top-10, tanpa "juru kunci"; bawaan Rahasia; pengingat niat saat berbagi.
- Pengingat kematian tanpa prediksi ajal; teks penyeimbang husnuzhan & larangan mengharap mati.
- Lingkaran: jenis campur / sesama jenis / keluarga; undangan perlu persetujuan.
- Sedekah: aplikasi tidak memproses uang.

## 4. Waktu salat
Perhitungan astronomis (Subuh 20°, Isya 18°, Asar Syafi'i, ihtiyath +2 menit) hanya untuk pengingat. Bandingkan dengan jadwal Kemenag/BMKG untuk kota-kota utama sebelum rilis.

## Catatan lisensi data
Paket `quran-json` berlisensi CC BY-SA 4.0 (file LICENSE; `package.json` menyebut CC-BY-4.0). Terjemah Kemenag via QuranEnc: **pastikan izin penggunaan komersial/redistribusi** sebelum rilis toko. Atribusi ada di `docs/esok/ATRIBUSI.md` & layar "Tentang".
