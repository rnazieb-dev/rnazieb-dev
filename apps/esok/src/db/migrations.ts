import type { Db } from './types';

/**
 * Catatan privasi:
 *  - `deeds` hanya memuat amal yang SENGAJA dibagikan (circle/public). CHECK mencegah 'secret'.
 *  - `private_items` memuat amalan rahasia & refleksi sebagai ciphertext. Kolom day/points/
 *    category/mission_id bersifat lokal-saja (tidak pernah diunggah) untuk streak & statistik
 *    pribadi; isi (judul/catatan) hanya ada di ciphertext.
 */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

  CREATE TABLE deeds (
    id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('circle','public')),
    circle_id TEXT,
    mission_id TEXT,
    shared_id TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX deeds_day ON deeds(day);

  CREATE TABLE private_items (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('deed','reflection')),
    day TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    mission_id TEXT,
    ciphertext TEXT NOT NULL,
    nonce TEXT NOT NULL,
    rev INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX private_items_day ON private_items(day);

  CREATE TABLE user_missions (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    day TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active','done','skipped')),
    completed_at TEXT,
    deed_id TEXT,
    UNIQUE (mission_id, day)
  );

  CREATE TABLE uzur_days (day TEXT PRIMARY KEY);
  CREATE TABLE quotes_seen (quote_id TEXT NOT NULL, seen_at TEXT NOT NULL);
  CREATE TABLE badges_earned (badge_id TEXT PRIMARY KEY, earned_at TEXT NOT NULL);
  CREATE TABLE sync_state (table_name TEXT PRIMARY KEY, cursor TEXT);
  `,
  `
  -- Amal bersama yang poin servernya sudah diminta (idempotensi sisi klien).
  CREATE TABLE awarded (deed_id TEXT PRIMARY KEY, points INTEGER NOT NULL DEFAULT 0);
  `,
  `
  -- Antrean "tandai selesai" misi bersama yang belum berhasil dikirim (dicoba ulang saat sync).
  CREATE TABLE pending_shared (shared_id TEXT PRIMARY KEY);
  `,
];

export async function migrate(db: Db): Promise<void> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.transaction(async () => {
      await db.exec(MIGRATIONS[v] as string);
      await db.exec(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
