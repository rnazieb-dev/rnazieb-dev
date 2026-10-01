import { addDeed, deleteDeed, getReflection, hydratePrivate, listDeedsForDay, saveReflection } from '@/db/repos';
import type { Db } from '@/db/types';
import { type Remote, type RemoteRow, type SyncTable, syncAll } from '@/features/sync/engine';
import { generateDek } from '@/features/security/e2ee';
import { createMigratedTestDb } from './helpers/testDb';

/** Remote palsu dengan aturan LWW yang sama seperti fungsi SQL server. */
class FakeRemote implements Remote {
  tables: Record<SyncTable, Map<string, RemoteRow>> = { deeds: new Map(), private_items: new Map() };
  clock = 0;
  pushLog: RemoteRow[] = [];
  async push(table: SyncTable, rows: RemoteRow[]) {
    for (const r of rows) {
      this.pushLog.push({ table, ...r });
      const cur = this.tables[table].get(r.id as string);
      const newer =
        !cur ||
        (table === 'private_items'
          ? (r.rev as number) > (cur.rev as number) || ((r.rev as number) === (cur.rev as number) && String(r.updated_at) > String(cur.updated_at))
          : String(r.updated_at) > String(cur.updated_at));
      if (newer) this.tables[table].set(r.id as string, { ...r, synced_at: String(++this.clock).padStart(8, '0') });
    }
  }
  async pull(table: SyncTable, cursor: string | null) {
    const rows = [...this.tables[table].values()]
      .filter((r) => !cursor || String(r.synced_at) > cursor)
      .sort((a, b) => String(a.synced_at).localeCompare(String(b.synced_at)));
    const last = rows[rows.length - 1];
    return { rows, cursor: last ? String(last.synced_at) : cursor };
  }
}

const DAY = '2026-10-01';
let a: Db;
let b: Db;
let remote: FakeRemote;
const dek = generateDek();

beforeEach(async () => {
  a = await createMigratedTestDb();
  b = await createMigratedTestDb();
  remote = new FakeRemote();
});

describe('sinkronisasi', () => {
  it('amal publik tersinkron antar perangkat; dirty dibersihkan', async () => {
    await addDeed(a, null, { day: DAY, title: 'berbagi takjil', category: 'sedekah', visibility: 'public', points: 5 });
    const r1 = await syncAll(a, remote);
    expect(r1.pushed.deeds).toBe(1);
    expect((await a.get<{ c: number }>('SELECT COUNT(*) c FROM deeds WHERE dirty = 1'))?.c).toBe(0);
    await syncAll(b, remote);
    expect((await listDeedsForDay(b, DAY, null))[0]?.title).toBe('berbagi takjil');
    // sinkron kedua tanpa perubahan: tidak ada push
    expect((await syncAll(a, remote)).pushed.deeds).toBe(0);
  });

  it('SERVER HANYA MENERIMA CIPHERTEXT untuk item rahasia — tidak ada teks, hari, poin, kategori', async () => {
    await addDeed(a, dek, { day: DAY, title: 'TEKS-RAHASIA', note: 'CATATAN-RAHASIA', category: 'sedekah', visibility: 'secret', points: 30, missionId: 'm-x' });
    await saveReflection(a, dek, DAY, { niat: 'NIAT-RAHASIA', syukur: '', penyesalan: '', tekad: '' });
    await syncAll(a, remote);
    const blob = JSON.stringify(remote.pushLog);
    expect(blob).not.toMatch(/TEKS-RAHASIA|CATATAN-RAHASIA|NIAT-RAHASIA/);
    for (const row of remote.pushLog.filter((r) => r.table === 'private_items')) {
      expect(Object.keys(row).sort()).toEqual(['ciphertext', 'deleted_at', 'id', 'kind', 'nonce', 'rev', 'table', 'updated_at']);
      expect(String(row.updated_at)).toMatch(/T00:00:00\.000Z$/);
    }
    expect(remote.pushLog.some((r) => r.table === 'deeds')).toBe(false);
  });

  it('perangkat kedua mendekripsi setelah hydrate', async () => {
    await addDeed(a, dek, { day: DAY, title: 'doa untuk ibu', category: 'keluarga', visibility: 'secret', points: 6 });
    await saveReflection(a, dek, DAY, { niat: 'ikhlas', syukur: 'sehat', penyesalan: '', tekad: '' });
    await syncAll(a, remote);
    await syncAll(b, remote);
    expect((await b.all('SELECT * FROM private_items WHERE day IS NULL')).length).toBe(2);
    await hydratePrivate(b, dek);
    expect((await listDeedsForDay(b, DAY, dek))[0]?.title).toBe('doa untuk ibu');
    expect((await getReflection(b, dek, DAY)).niat).toBe('ikhlas');
  });

  it('konflik refleksi: rev lebih tinggi menang', async () => {
    await saveReflection(a, dek, DAY, { niat: 'v1', syukur: '', penyesalan: '', tekad: '' });
    await syncAll(a, remote);
    await syncAll(b, remote);
    await hydratePrivate(b, dek);
    // a mengedit 2×, b mengedit 1× secara offline
    await saveReflection(a, dek, DAY, { niat: 'a-2', syukur: '', penyesalan: '', tekad: '' });
    await saveReflection(a, dek, DAY, { niat: 'a-3', syukur: '', penyesalan: '', tekad: '' });
    await saveReflection(b, dek, DAY, { niat: 'b-2', syukur: '', penyesalan: '', tekad: '' });
    await syncAll(b, remote);
    await syncAll(a, remote);
    await syncAll(b, remote);
    await hydratePrivate(a, dek);
    await hydratePrivate(b, dek);
    expect((await getReflection(a, dek, DAY)).niat).toBe('a-3');
    expect((await getReflection(b, dek, DAY)).niat).toBe('a-3');
  });

  it('penghapusan merambat (soft delete)', async () => {
    const id = await addDeed(a, null, { day: DAY, title: 'x', category: 'diri', visibility: 'public' });
    await syncAll(a, remote);
    await syncAll(b, remote);
    expect(await listDeedsForDay(b, DAY, null)).toHaveLength(1);
    await new Promise((r) => setTimeout(r, 5));
    await deleteDeed(a, id);
    await syncAll(a, remote);
    await syncAll(b, remote);
    expect(await listDeedsForDay(b, DAY, null)).toHaveLength(0);
  });

  it('kegagalan jaringan tidak merusak data lokal & tetap dirty', async () => {
    await addDeed(a, null, { day: DAY, title: 'x', category: 'diri', visibility: 'public' });
    const failing: Remote = { push: async () => { throw new Error('offline'); }, pull: async () => ({ rows: [], cursor: null }) };
    await expect(syncAll(a, failing)).rejects.toThrow('offline');
    expect((await a.get<{ c: number }>('SELECT COUNT(*) c FROM deeds WHERE dirty = 1'))?.c).toBe(1);
    await syncAll(a, remote);
    expect((await a.get<{ c: number }>('SELECT COUNT(*) c FROM deeds WHERE dirty = 1'))?.c).toBe(0);
  });
});
