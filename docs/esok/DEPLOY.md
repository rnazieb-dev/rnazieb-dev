# Esok — Penyiapan, uji, dan rilis

## 1. Lokal
```bash
cd apps/esok
npm install            # .npmrc memakai legacy-peer-deps
npm run build:content  # (opsional) bangun ulang konten & seed poin dari content/*.json
npm run typecheck && npm run lint && npm test
npx expo start         # perlu dev client / Expo Go untuk SDK 57
```
Tanpa Supabase, aplikasi berjalan penuh secara lokal (cloud/lingkaran dinonaktifkan).

## 2. Supabase (untuk lingkaran & cadangan)
1. Buat proyek Supabase. Jalankan `supabase/migrations/0001_init.sql` lalu `0002_mission_points.sql` (CLI: `supabase db push`).
2. Auth → aktifkan Email; atur *redirect URL*/templat bahasa Indonesia. (Google/Apple: tambahkan kredensial OAuth lalu sambungkan `signInWithIdToken` — belum diimplementasikan.)
3. Salin `.env.example` → `.env`, isi `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key aman di klien karena RLS; **jangan** pernah memakai service role di aplikasi).
4. Push (opsional): `supabase functions deploy send-push`, set secret `WEBHOOK_SECRET`; buat Database Webhook (INSERT pada `public.nudges`) → URL function dengan header `x-webhook-secret`. Isi `extra.eas.projectId` di `app.json` (hasil `eas init`).
5. Tinjau laporan: tabel `reports` via dasbor (service role).

## 3. Build & rilis (butuh akun Apple Developer & Google Play)
```bash
npm i -g eas-cli && eas login && eas init
eas build --profile preview --platform all      # uji internal
eas build --profile production --platform all && eas submit
```
Sebelum rilis publik: selesaikan `docs/esok/SYARIAH-REVIEW.md`, tinjauan hukum `PRIVASI.md`, siapkan kebijakan privasi publik, kontak moderator. Ikon & splash final sudah ada (motif tunas kurma; sumber vektor `apps/esok/assets/*.svg`, bangun ulang dengan `npm run build:assets`); pertimbangkan tinjauan desainer sebelum rilis toko.

## 4. Uji manual wajib di perangkat (belum dilakukan di lingkungan pengembangan)
- Notifikasi muncul tepat waktu setelah aplikasi ditutup/ponsel di-reboot; mode salat dengan lokasi.
- Biometrik/PIN, kunci otomatis setelah >60 dtk di latar, FLAG_SECURE (tangkapan layar diblokir di Amalan rahasia/Refleksi), blur app switcher (iOS).
- Dua akun & dua perangkat: sinkron, konflik offline, E2EE (perangkat baru memakai passphrase/kunci pemulihan), lingkaran → persetujuan → feed → misi bersama → konfirmasi → poin → peringkat, tantangan, nudges/push.
- Aksesibilitas (VoiceOver/TalkBack, ukuran font besar), mode gelap, layar kecil.
