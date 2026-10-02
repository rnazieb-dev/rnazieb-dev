# Listing toko — NAFS

| Kolom | Nilai |
|---|---|
| Nama aplikasi (launcher, `expo.name`) | **NAFS App** |
| Judul Google Play (maks. 30 karakter) | **NAFS: Your Daily Islamic Reminder** (33 karakter — lihat catatan) |
| Nama App Store (maks. 30 karakter) | NAFS App |

> Catatan: Google Play membatasi judul 30 karakter. "NAFS: Your Daily Islamic Reminder" = 33 karakter, jadi akan ditolak.
> Alternatif ≤30: "NAFS: Daily Islamic Reminder" (28) atau "NAFS – Islamic Daily Reminder" (29). Pilih salah satu sebelum unggah.

Deskripsi singkat (≤80): Ingat mati, isi hari ini dengan kebaikan: jurnal amal, misi, dzikir & jadwal salat.

Identitas teknis yang **tidak** ikut berganti (aman dibiarkan sebelum rilis pertama):
- `expo.slug = hari-ini` dan `extra.eas.projectId` — terikat proyek EAS "Hari Ini".
- `android.package` / `ios.bundleIdentifier` = `nazib.nafs` — **permanen setelah rilis pertama di toko**.
