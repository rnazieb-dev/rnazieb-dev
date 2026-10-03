# Build tanpa Expo berbayar (EAS)

Kuota gratis EAS Build/CI terbatas. Aplikasi ini adalah proyek Expo biasa, jadi bisa dibangun sendiri.

## 1. GitHub Actions → APK/AAB (disarankan)

Workflow: `.github/workflows/android-apk.yml` (jalankan manual lewat *Actions → Android APK → Run workflow*, atau push tag `v*`).

- Alur: `expo prebuild --platform android` → patch penandatanganan (`apps/esok/scripts/android-release-signing.mjs`) → `./gradlew assembleRelease`. Hasil: artifact `nafs-android` (APK; AAB bila diminta).
- Menit Actions **gratis untuk repo publik**; repo privat dapat kuota bulanan terbatas. Cek visibilitas repo sebelum mengandalkan ini.
- Variabel repo (Settings → Variables): semua `EXPO_PUBLIC_*` yang dipakai (mis. `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_DONATE_URL`).
- Secrets untuk APK bertanda tangan rilis: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Tanpa secret ini, APK ditandatangani kunci debug (cukup untuk uji pasang, **tidak** untuk Play Store).
- Membuat keystore:
  ```
  keytool -genkeypair -v -storetype PKCS12 -keystore nafs.jks -alias nafs \
    -keyalg RSA -keysize 2048 -validity 10000
  base64 -w0 nafs.jks   # isi ke ANDROID_KEYSTORE_BASE64
  ```
  Simpan keystore & sandi di tempat aman di luar repo. Untuk Play Store, aktifkan **Play App Signing** agar kunci yang hilang masih bisa dipulihkan.
- Catatan jujur: workflow ini sudah diuji sampai `expo prebuild` dan skrip tanda tangan, tetapi **belum dijalankan penuh di runner** (sandbox tidak punya Android SDK). Kemungkinan perlu satu-dua perbaikan pada run pertama.

## 2. `eas build --local`
Memakai CLI EAS tetapi membangun di mesin sendiri (butuh Android SDK/JDK 17); tidak memakai kuota cloud: `npx eas-cli build --platform android --profile preview --local`.

## 3. Preview tanpa build
GitHub Codespaces (atau komputer lain) + `npx expo start --tunnel`, lalu buka lewat Expo Go. Cocok untuk pratinjau cepat; fitur notifikasi dibatasi di Expo Go.

## 4. iOS
Wajib akun Apple Developer dan macOS (EAS cloud atau runner `macos-*` GitHub Actions; menit macOS berbobot lebih mahal).

## 5. Upgrade
Bila kuota jadi hambatan tetap, paket berbayar Expo adalah opsi paling sedikit perawatan.
