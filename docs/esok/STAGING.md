# Esok — Staging preview (Android APK via EAS)

Profil `preview` di `apps/esok/eas.json` menghasilkan **APK internal** (distribusi internal, tanpa Play Store) yang dapat dipasang langsung. Preview bawaan berjalan **lokal saja** (tanpa Supabase); lingkaran/cloud nonaktif.

## Sekali saja (butuh akun Expo; tidak dapat dilakukan dari lingkungan pengembangan Claude)
1. `cd apps/esok && npx eas-cli login`
2. `npx eas-cli init --id 9cfd7775-2dc4-496e-803a-8f1350b40e17` (proyek EAS `hidup-hanya-hari-ini`; `projectId` 2. `npx eas-cli init` — membuat proyek EAS dan mengisi `expo.extra.eas.projectId` di `app.json` (commit hasilnya). `slug` sudah terisi di `app.json`).
3. Di dashboard Expo → proyek → **GitHub**: hubungkan repo `rnazieb-dev/rnazieb-dev` dan atur **Base directory** = `apps/esok` (monorepo).

## Jalankan build
- Lewat CLI: `cd apps/esok && npx eas-cli build --profile preview --platform android`
- Atau minta Claude (MCP Expo `build_run`): `platform=ANDROID`, `buildProfile=preview`, `baseDirectory=apps/esok`, `gitRef=main` — butuh nama proyek `@akun/slug` (atau `projectId`) dan anggaran build (`usage_budget_create`).

Setelah selesai, buka halaman build (atau pindai QR) di ponsel Android dan pasang APK. Izinkan "pasang dari sumber ini".

## Dengan Supabase (opsional)
Tambahkan environment variable EAS untuk profil `preview`:
`EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY` (lihat `DEPLOY.md` §2), lalu jalankan migrasi `0001`–`0003`.

## iOS
Build internal iOS membutuhkan Apple Developer, provisioning ad-hoc, dan perangkat terdaftar (`eas device:create`); kredensial disiapkan interaktif lewat CLI. Untuk uji cepat gunakan TestFlight (profil `production` + `eas submit`).

## Daftar uji manual di perangkat
Lihat `DEPLOY.md` §4 (notifikasi setelah ditutup/reboot, biometrik/PIN, tangkapan layar, dua akun, sinkron, dzikir & catatan utang).
