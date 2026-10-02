import type { Db } from '@/db/types';

export type SyncTable = 'deeds' | 'private_items';
export type RemoteRow = Record<string, string | number | null>;

export interface Remote {
  /** Upsert dengan aturan LWW di sisi server. */
  push(table: SyncTable, rows: RemoteRow[]): Promise<void>;
  /** Baris yang berubah sejak cursor (cursor = stempel waktu server). */
  pull(table: SyncTable, cursor: string | null): Promise<{ rows: RemoteRow[]; cursor: string | null }>;
}

/**
 * Kolom yang diunggah. Item rahasia HANYA mengunggah ciphertext+metadata kasar;
 * day/points/category/mission_id lokal tidak pernah keluar perangkat.
 */
const COLUMNS: Record<SyncTable, string[]> = {
  deeds: ['id', 'day', 'title', 'note', 'category', 'visibility', 'circle_id', 'mission_id', 'shared_id', 'points', 'created_at', 'updated_at', 'deleted_at'],
  private_items: ['id', 'kind', 'ciphertext', 'nonce', 'rev', 'updated_at', 'deleted_at'],
};

export interface SyncResult {
  pushed: Record<SyncTable, number>;
  pulled: Record<SyncTable, number>;
}

const PAGE = 500;

async function pushDirty(db: Db, remote: Remote, table: SyncTable): Promise<number> {
  const cols = COLUMNS[table];
  const rows = await db.all<RemoteRow>(`SELECT ${cols.join(', ')} FROM ${table} WHERE dirty = 1`);
  if (rows.length === 0) return 0;
  for (let i = 0; i < rows.length; i += PAGE) await remote.push(table, rows.slice(i, i + PAGE));
  // Hanya tandai bersih jika baris belum berubah lagi selama push.
  for (const r of rows) {
    await db.run(`UPDATE ${table} SET dirty = 0 WHERE id = ? AND updated_at = ? ${table === 'private_items' ? 'AND rev = ?' : ''}`, [
      r.id as string,
      r.updated_at as string,
      ...(table === 'private_items' ? [r.rev as number] : []),
    ]);
  }
  return rows.length;
}

const TS_COLS = new Set(['created_at', 'updated_at', 'deleted_at']);
const ts = (v: string | number | null | undefined): number => (v == null ? 0 : Date.parse(String(v)));
/** Seragamkan format stempel waktu (Postgres → ISO 'Z') agar perbandingan konsisten. */
function normalize(col: string, v: string | number | null | undefined): string | number | null {
  if (v == null) return null;
  return TS_COLS.has(col) ? new Date(String(v)).toISOString() : v;
}

/** LWW: deeds → updated_at; private_items → rev, lalu updated_at. Seri → pertahankan lokal. */
async function mergeRow(db: Db, table: SyncTable, row: RemoteRow): Promise<boolean> {
  const local = await db.get<{ updated_at: string; rev?: number; nonce?: string; dirty: number }>(
    `SELECT updated_at, ${table === 'private_items' ? 'rev, nonce,' : ''} dirty FROM ${table} WHERE id = ?`,
    [row.id as string],
  );
  if (local) {
    const remoteNewer =
      table === 'private_items'
        ? (row.rev as number) > (local.rev ?? 0) ||
          ((row.rev as number) === (local.rev ?? 0) && ts(row.updated_at) > ts(local.updated_at)) ||
          // Seri penuh: nonce terbesar menang — aturan identik dengan server agar konvergen.
          ((row.rev as number) === (local.rev ?? 0) &&
            ts(row.updated_at) === ts(local.updated_at) &&
            String(row.nonce) > (local.nonce ?? ''))
        : ts(row.updated_at) > ts(local.updated_at);
    if (!remoteNewer) return false;
  }
  const cols = COLUMNS[table];
  const values = cols.map((c) => normalize(c, row[c]));
  if (local) {
    const sets = cols.filter((c) => c !== 'id').map((c) => `${c} = ?`);
    await db.run(`UPDATE ${table} SET ${sets.join(', ')}, dirty = 0 WHERE id = ?`, [
      ...cols.filter((c) => c !== 'id').map((c) => normalize(c, row[c])),
      row.id as string,
    ]);
    if (table === 'private_items') {
      // Isi berubah di perangkat lain → kolom lokal harus dihidrasi ulang.
      await db.run('UPDATE private_items SET day = NULL WHERE id = ?', [row.id as string]);
    }
  } else {
    await db.run(`INSERT INTO ${table}(${cols.join(', ')}, dirty) VALUES(${cols.map(() => '?').join(', ')}, 0)`, values);
  }
  return true;
}

async function pullTable(db: Db, remote: Remote, table: SyncTable): Promise<number> {
  const st = await db.get<{ cursor: string | null }>('SELECT cursor FROM sync_state WHERE table_name = ?', [table]);
  let cursor = st?.cursor ?? null;
  let merged = 0;
  for (let guard = 0; guard < 1000; guard++) {
    const page = await remote.pull(table, cursor);
    for (const row of page.rows) if (await mergeRow(db, table, row)) merged++;
    const advanced = !!page.cursor && page.cursor !== cursor;
    if (advanced) {
      cursor = page.cursor;
      await db.run(
        'INSERT INTO sync_state(table_name, cursor) VALUES(?, ?) ON CONFLICT(table_name) DO UPDATE SET cursor = excluded.cursor',
        [table, cursor],
      );
    }
    if (page.rows.length < PAGE || !advanced) break;
  }
  return merged;
}

/** Sinkron dua arah. Aman dipanggil berulang; kegagalan jaringan melempar error tanpa merusak data lokal. */
export async function syncAll(db: Db, remote: Remote): Promise<SyncResult> {
  const result: SyncResult = { pushed: { deeds: 0, private_items: 0 }, pulled: { deeds: 0, private_items: 0 } };
  for (const t of ['deeds', 'private_items'] as SyncTable[]) {
    result.pushed[t] = await pushDirty(db, remote, t);
    result.pulled[t] = await pullTable(db, remote, t);
  }
  return result;
}
