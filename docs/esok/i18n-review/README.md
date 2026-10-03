# Tinjauan terjemahan antarmuka NAFS (27 bahasa)

> Semua terjemahan dibuat dan ditinjau oleh model bahasa. **Belum ada tinjauan penutur asli.** Dokumen ini adalah bahan kerja bagi peninjau manusia, bukan pengganti mereka.

Laporan rinci per bahasa (perbaikan yang diterapkan + butir yang perlu dicek, urut risiko):
`ar.md` (ar, ur, fa, ps, bn) · `tr.md` (tr, az, uz, kk, ru) · `ms.md` (ms, fr, de, es, nl) · `sw.md` (sw, ha, so, yo, hi) · `zh.md` (zh, bs, sq, tl, th)

## Tingkat keyakinan (menurut peninjau model)
| Tinggi | Sedang-tinggi | Sedang | Rendah |
|---|---|---|---|
| ar, tr, hi | ur, bn, az, uz, ru, ms, fr, de, nl, sw, ha, zh, bs | fa, kk, es, so, sq, tl, th | **ps (beta)**, **yo (beta)** |

Bahasa berkeyakinan rendah ditandai "(beta)" di pemilih bahasa. Jangan mengiklankannya sebagai "tinjauan lengkap" sebelum dicek penutur asli.

## Temuan lintas bahasa (perlu keputusan/rekayasa)
1. **Bentuk jamak setelah angka** ("{n} hari", "{n} actions"): salah untuk sebagian bilangan di Arab, Rusia, Slavia, dan lainnya. Butuh sistem jamak (CLDR/ICU) di kode atau kata tanpa angka.
2. ~~Jenis grup "sesama jenis"~~ **Selesai:** semua bahasa kini "hanya pria atau hanya wanita" (en/id diganti di sumber; 22 bahasa lain diterjemahkan ulang oleh model — tetap perlu dicek penutur asli).
3. **"Tantangan/challenge"**: di tr ("meydan okuma"), uz ("musobaqa") bermakna perlawanan/perlombaan, tidak sesuai semangat kolektif non-kompetitif.
4. **Muhasabah** dirender dekat dengan kata "akuntansi" di tr, az, sq. Pertimbangkan kata refleksi diri atau pinjaman Arab.
5. **Nomor hotline/mata uang** kini per negara (lihat PR), tetapi daftar nomor harus diverifikasi sebelum rilis.
6. **Angka**: fa/ps/bn kini memakai angka Latin di teks agar konsisten dengan `{n}` runtime. Pembaca Persia/Bengali mungkin mengharapkan angka lokal (butuh pemformatan angka di kode).
7. **Istilah dengan konotasi agama lain**: "Gottesdienst" (de), "Wegzehrung" (de), "Chapelet" (fr), "Misheni" (sw), "Pagsamba" (tl), "ผลบุญ/ทาน" (th). Pertimbangkan pinjaman Islami (ibadah, tasbih, dll.) setelah masukan komunitas.
8. **Pilihan ejaan translitterasi** belum seragam di beberapa bahasa (fr, de, es, nl): tetapkan satu kebijakan per bahasa (mis. mengikuti lembaga Islam setempat).
9. **Kata ganti/register**: de/es/nl "du/tú/je", fr "vous", fa kini "شما" — konfirmasi preferensi pasar.
10. **zh**: seluruh berkas memakai 安拉; banyak Muslim Hui memakai 真主. Putuskan.

## Proses tinjauan penutur asli (disarankan)
1. Rekrut 1–2 penutur asli Muslim per bahasa (komunitas, mahasiswa, ustadz setempat). Prioritas pasar: ar, ur, bn, tr, ms, fr, hi, fa, ru, sw, zh.
2. Beri mereka laporan bahasanya + layar aplikasi (tangkapan layar). Minta: koreksi istilah, daftar kata yang terasa janggal/menyinggung, dan keputusan atas butir "perlu penutur asli".
3. Terapkan lewat PR yang mengubah `apps/esok/src/i18n/locales/<kode>.ts` dan `extra/<kode>.ts` (tes kamus memastikan kunci & placeholder tetap utuh).
4. Setelah ditinjau, hapus `beta: true` dari `LANGUAGES` di `src/i18n/index.ts`.
5. Konten (kutipan, doa, misi) dan terjemah Al-Qur'an di luar bahasa Indonesia: **belum diterjemahkan**; butuh sumber berlisensi dan tinjauan ustadz sebelum ditambahkan.
