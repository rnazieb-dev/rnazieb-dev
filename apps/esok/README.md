# NAFS

Pengingat kematian & jurnal/permainan kebaikan harian ("hari ini seakan esok tiada") — Android & iOS.

Dokumentasi: [`docs/esok/`](../../docs/esok) · Penyiapan: [`DEPLOY.md`](../../docs/esok/DEPLOY.md) · **Tinjauan syar'i wajib**: [`SYARIAH-REVIEW.md`](../../docs/esok/SYARIAH-REVIEW.md)

```bash
npm install
npm run typecheck && npm run lint && npm test   # 70+ tes unit + 22 tes RLS (pglite)
npx expo start
```

Struktur: `app/` (rute expo-router) · `src/features/*` (logika per fitur) · `src/db` (SQLite lokal) · `src/content` (kutipan & misi) · `content/*.source.json` (sumber konten) · `supabase/` (migrasi, RLS, edge function) · `__tests__/`.
