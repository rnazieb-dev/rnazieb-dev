import { MIGRATIONS, migrate } from '@/db/migrations';
import { activityDays, hydratePrivate, pointTotals, saveReflection } from '@/db/repos';
import { buildExport } from '@/features/export/bundle';
import { formatRupiah, parseRupiah } from '@/features/ledger/format';
import {
  countLedger,
  deleteLedgerItem,
  dueCounts,
  dueDaysBetween,
  listLedger,
  saveLedgerItem,
  settleLedgerItem,
} from '@/features/ledger/repo';
import type { LedgerPayload } from '@/features/ledger/types';
import { generateDek } from '@/features/security/e2ee';
import { type Remote, syncAll } from '@/features/sync/engine';
import { createMigratedTestDb, createTestDb } from './helpers/testDb';

const dek = generateDek();
const base: LedgerPayload = {
  type: 'utang', title: 'Pinjam modal', counterparty: 'Budi Santoso', amountIdr: 1500000, note: 'lunasi sebelum Ramadan',
  createdDay: '2026-10-01', dueDay: '2026-10-10', settled: false, settledDay: null,
};

describe('catatan utang/piutang/amanah/wasiat (E2EE)', () => {
  it('terenkripsi di DB: tak ada nama/nominal/catatan dalam teks polos; kolom lokal hanya hari jatuh tempo & status', async () => {
    const db = await createMigratedTestDb();
    await saveLedgerItem(db, dek, base);
    const row = await db.get<Record<string, unknown>>("SELECT * FROM private_items WHERE kind = 'ledger'");
    expect(JSON.stringify(row)).not.toMatch(/Budi|1500000|Ramadan|Pinjam/);
    expect(row).toMatchObject({ kind: 'ledger', due_day: '2026-10-10', open: 1, day: '2026-10-01', points: 0 });
  });

  it('simpan → daftar → ubah (rev naik) → lunas → hapus', async () => {
    const db = await createMigratedTestDb();
    const id = await saveLedgerItem(db, dek, base);
    expect((await listLedger(db, dek))[0]).toMatchObject({ id, title: 'Pinjam modal', counterparty: 'Budi Santoso', amountIdr: 1500000 });
    await saveLedgerItem(db, dek, { ...base, amountIdr: 1000000 }, id);
    expect((await listLedger(db, dek))[0]?.amountIdr).toBe(1000000);
    expect((await db.get<{ rev: number }>('SELECT rev FROM private_items WHERE id = ?', [id]))?.rev).toBe(2);
    await settleLedgerItem(db, dek, id, true, '2026-10-05');
    expect(await countLedger(db)).toEqual({ total: 1, open: 0 });
    expect((await listLedger(db, dek))[0]).toMatchObject({ settled: true, settledDay: '2026-10-05' });
    await deleteLedgerItem(db, id);
    expect(await listLedger(db, dek)).toHaveLength(0);
    expect(await countLedger(db)).toEqual({ total: 0, open: 0 });
  });

  it('wasiat: tanpa nominal/jatuh tempo, tidak pernah "terbuka"; judul wajib', async () => {
    const db = await createMigratedTestDb();
    await saveLedgerItem(db, dek, { ...base, type: 'wasiat', title: 'Wasiat saya', amountIdr: 5, dueDay: '2026-10-09' });
    const w = (await listLedger(db, dek))[0]!;
    expect(w).toMatchObject({ type: 'wasiat', amountIdr: null, dueDay: null });
    expect(await countLedger(db)).toEqual({ total: 1, open: 0 });
    await expect(saveLedgerItem(db, dek, { ...base, title: '   ' })).rejects.toThrow(/Judul/);
  });

  it('urutan: terbuka (jatuh tempo terdekat) → selesai → wasiat', async () => {
    const db = await createMigratedTestDb();
    await saveLedgerItem(db, dek, { ...base, title: 'W', type: 'wasiat' });
    await saveLedgerItem(db, dek, { ...base, title: 'Selesai', settled: true, settledDay: '2026-10-02' });
    await saveLedgerItem(db, dek, { ...base, title: 'Nanti', dueDay: '2026-11-01' });
    await saveLedgerItem(db, dek, { ...base, title: 'Dekat', dueDay: '2026-10-03' });
    expect((await listLedger(db, dek)).map((x) => x.title)).toEqual(['Dekat', 'Nanti', 'Selesai', 'W']);
  });

  it('hitungan jatuh tempo tanpa membuka vault (kolom lokal)', async () => {
    const db = await createMigratedTestDb();
    await saveLedgerItem(db, dek, { ...base, dueDay: '2026-09-30' }); // lewat
    await saveLedgerItem(db, dek, { ...base, dueDay: '2026-10-04' }); // dalam 7 hari
    await saveLedgerItem(db, dek, { ...base, dueDay: '2026-12-01' }); // jauh
    await saveLedgerItem(db, dek, { ...base, dueDay: '2026-09-29', settled: true, settledDay: '2026-09-29' }); // selesai
    await saveLedgerItem(db, dek, { ...base, dueDay: null }); // tanpa jatuh tempo
    expect(await dueCounts(db, '2026-10-01')).toEqual({ overdue: 1, soon: 1 });
    expect(await dueDaysBetween(db, '2026-10-01', '2026-10-31')).toEqual(['2026-10-04']);
  });

  it('tidak dihitung sebagai amal: tak memengaruhi streak, poin, atau hari aktif', async () => {
    const db = await createMigratedTestDb();
    await saveLedgerItem(db, dek, base);
    expect((await activityDays(db, { includeSecret: true })).size).toBe(0);
    expect(await pointTotals(db)).toEqual({ publicPoints: 0, secretPoints: 0, secretCount: 0 });
  });

  it('format rupiah', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
    expect(formatRupiah(999)).toBe('Rp 999');
    expect(parseRupiah('Rp 1.500.000')).toBe(1500000);
    expect(parseRupiah('abc')).toBeNull();
  });

  it('ekspor menyertakan catatan hanya bila kunci tersedia', async () => {
    const db = await createMigratedTestDb();
    await saveLedgerItem(db, dek, base);
    expect((await buildExport(db, null)).ledger).toHaveLength(0);
    expect((await buildExport(db, dek)).ledger[0]).toMatchObject({ title: 'Pinjam modal', counterparty: 'Budi Santoso' });
  });
});

describe('migrasi tabel private_items (SQLite)', () => {
  it('data lama tetap utuh dan jenis ledger dapat disimpan; jenis asing ditolak', async () => {
    const db = createTestDb();
    // terapkan hanya 3 migrasi pertama (skema sebelum ledger)
    for (let i = 0; i < 3; i++) await db.exec(MIGRATIONS[i] as string);
    await db.exec('PRAGMA user_version = 3');
    await db.exec(`INSERT INTO deeds(id, day, title, category, visibility, created_at, updated_at) VALUES('d','2026-10-01','t','diri','public','a','b')`);
    await saveReflection(db, dek, '2026-10-01', { niat: 'x', syukur: '', penyesalan: '', tekad: '' }).catch(() => undefined);
    await db.run(`INSERT INTO private_items(id, kind, day, ciphertext, nonce, updated_at) VALUES('old','deed','2026-10-01','c','n','2026-10-01T00:00:00.000Z')`);
    await migrate(db);
    expect((await db.get<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(MIGRATIONS.length);
    expect(await db.get('SELECT id FROM private_items WHERE id = ?', ['old'])).toBeTruthy();
    await saveLedgerItem(db, dek, base);
    await expect(db.run(`INSERT INTO private_items(id, kind, ciphertext, nonce, updated_at) VALUES('x','bogus','c','n','t')`)).rejects.toThrow();
  });
});

describe('sinkronisasi catatan', () => {
  class Fake implements Remote {
    rows = new Map<string, Record<string, string | number | null>>();
    log: Record<string, string | number | null>[] = [];
    async push(table: string, rows: Record<string, string | number | null>[]) {
      if (table !== 'private_items') return;
      for (const r of rows) {
        this.log.push(r);
        this.rows.set(r.id as string, { ...r, synced_at: String(this.rows.size + 1).padStart(6, '0') });
      }
    }
    async pull(table: string, cursor: string | null) {
      if (table !== 'private_items') return { rows: [], cursor };
      const rows = [...this.rows.values()].filter((r) => !cursor || String(r.synced_at) > cursor);
      return { rows, cursor: rows.length ? String(rows[rows.length - 1]?.synced_at) : cursor };
    }
  }
  it('server hanya melihat ciphertext; perangkat lain membaca & mendapat jatuh tempo setelah hydrate', async () => {
    const a = await createMigratedTestDb();
    const b = await createMigratedTestDb();
    const remote = new Fake();
    await saveLedgerItem(a, dek, base);
    await syncAll(a, remote);
    expect(JSON.stringify(remote.log)).not.toMatch(/Budi|1500000|Ramadan|2026-10-10/);
    for (const r of remote.log) expect(Object.keys(r).sort()).toEqual(['ciphertext', 'deleted_at', 'id', 'kind', 'nonce', 'rev', 'updated_at']);
    await syncAll(b, remote);
    expect(await dueCounts(b, '2026-10-01', 10)).toEqual({ overdue: 0, soon: 0 }); // belum dihidrasi
    await hydratePrivate(b, dek);
    expect(await dueCounts(b, '2026-10-01', 10)).toEqual({ overdue: 0, soon: 1 });
    expect((await listLedger(b, dek))[0]).toMatchObject({ counterparty: 'Budi Santoso' });
  });
});
