import { MISSIONS } from '@/content';
import {
  activityDays,
  addDeed,
  categoryCounts,
  deleteDeed,
  getReflection,
  hydratePrivate,
  listDeedsForDay,
  pointTotals,
  saveReflection,
  setUzur,
  wipeLocal,
} from '@/db/repos';
import { generateDek } from '@/features/security/e2ee';
import { loadProgress } from '@/features/gamification/progress';
import { completeMission, ensureAssignments } from '@/features/missions/service';
import { createMigratedTestDb } from './helpers/testDb';
import type { Db } from '@/db/types';

let db: Db;
const dek = generateDek();
const DAY = '2026-10-01';

beforeEach(async () => {
  db = await createMigratedTestDb();
});

describe('amalan rahasia', () => {
  it('disimpan sebagai ciphertext, tidak ada teks polos di DB', async () => {
    await addDeed(db, dek, { day: DAY, title: 'sedekah subuh rahasia', note: 'RAHASIA-XYZ', category: 'sedekah', visibility: 'secret', points: 10 });
    const rows = await db.all<Record<string, unknown>>('SELECT * FROM private_items');
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toMatch(/sedekah subuh rahasia|RAHASIA-XYZ/);
    expect(await db.all('SELECT * FROM deeds')).toHaveLength(0);
  });

  it('terkunci → konten kosong; terbuka → terbaca', async () => {
    await addDeed(db, dek, { day: DAY, title: 'doa diam-diam', category: 'ibadah', visibility: 'secret' });
    const locked = await listDeedsForDay(db, DAY, null);
    expect(locked[0]).toMatchObject({ secret: true, locked: true, title: '' });
    const open = await listDeedsForDay(db, DAY, dek);
    expect(open[0]).toMatchObject({ secret: true, locked: false, title: 'doa diam-diam' });
  });

  it('tidak bisa menyimpan rahasia tanpa kunci', async () => {
    await expect(addDeed(db, null, { day: DAY, title: 'x', category: 'diri', visibility: 'secret' })).rejects.toThrow(/terkunci/);
  });

  it('tabel deeds menolak visibilitas "secret" (CHECK)', async () => {
    await expect(
      db.run(`INSERT INTO deeds(id, day, title, category, visibility, created_at, updated_at) VALUES('x','${DAY}','t','diri','secret','a','b')`),
    ).rejects.toThrow();
  });

  it('refleksi terenkripsi, round-trip, dan versi (rev) naik saat diubah', async () => {
    await saveReflection(db, dek, DAY, { niat: 'ikhlas', syukur: 'sehat', penyesalan: '', tekad: 'sabar' });
    await saveReflection(db, dek, DAY, { niat: 'ikhlas 2', syukur: 'sehat', penyesalan: '', tekad: 'sabar' });
    expect((await getReflection(db, dek, DAY)).niat).toBe('ikhlas 2');
    const row = await db.get<{ rev: number; ciphertext: string }>('SELECT rev, ciphertext FROM private_items');
    expect(row?.rev).toBe(2);
    expect(row?.ciphertext).not.toContain('ikhlas');
  });

  it('amal rahasia memberi poin pribadi, bukan poin publik', async () => {
    await addDeed(db, dek, { day: DAY, title: 's', category: 'sedekah', visibility: 'secret', points: 20 });
    await addDeed(db, dek, { day: DAY, title: 'p', category: 'keluarga', visibility: 'public', points: 5 });
    expect(await pointTotals(db)).toEqual({ publicPoints: 5, secretPoints: 20, secretCount: 1 });
    const p = await loadProgress(db, DAY);
    expect(p.personal.points).toBe(25);
    expect(p.publicView.points).toBe(5);
  });

  it('tampilan publik (level/streak) tidak berubah karena amalan rahasia', async () => {
    const before = await loadProgress(db, DAY);
    for (let i = 0; i < 40; i++) await addDeed(db, dek, { day: DAY, title: `r${i}`, category: 'sedekah', visibility: 'secret', points: 30 });
    const after = await loadProgress(db, DAY);
    expect(after.publicView).toEqual(before.publicView);
    expect(after.personal.level.level).toBeGreaterThan(before.personal.level.level);
  });

  it('hapus (soft delete) menandai dirty & menaikkan rev', async () => {
    const id = await addDeed(db, dek, { day: DAY, title: 's', category: 'diri', visibility: 'secret' });
    await deleteDeed(db, id);
    expect(await listDeedsForDay(db, DAY, dek)).toHaveLength(0);
    const row = await db.get<{ rev: number; dirty: number; deleted_at: string | null }>('SELECT rev, dirty, deleted_at FROM private_items');
    expect(row?.rev).toBe(2);
    expect(row?.dirty).toBe(1);
    expect(row?.deleted_at).not.toBeNull();
  });

  it('timestamp item rahasia dikaburkan ke hari (bukan jam pasti)', async () => {
    await addDeed(db, dek, { day: DAY, title: 's', category: 'diri', visibility: 'secret' });
    const row = await db.get<{ updated_at: string }>('SELECT updated_at FROM private_items');
    expect(row?.updated_at).toMatch(/T00:00:00\.000Z$/);
  });

  it('hydratePrivate mengisi kolom lokal untuk item hasil pull', async () => {
    const id = await addDeed(db, dek, { day: DAY, title: 's', category: 'ibadah', visibility: 'secret', points: 7 });
    await db.run('UPDATE private_items SET day = NULL, points = 0, category = NULL WHERE id = ?', [id]);
    expect(await hydratePrivate(db, dek)).toBe(1);
    const r = await db.get<{ day: string; points: number; category: string }>('SELECT day, points, category FROM private_items');
    expect(r).toEqual({ day: DAY, points: 7, category: 'ibadah' });
  });
});

describe('aktivitas & statistik', () => {
  it('hari aktif memisahkan publik vs semua', async () => {
    await addDeed(db, dek, { day: '2026-09-30', title: 'a', category: 'diri', visibility: 'secret' });
    await addDeed(db, dek, { day: DAY, title: 'b', category: 'diri', visibility: 'public' });
    expect([...(await activityDays(db, { includeSecret: false }))]).toEqual([DAY]);
    expect((await activityDays(db, { includeSecret: true })).size).toBe(2);
    expect(await categoryCounts(db, { includeSecret: true })).toEqual({ diri: 2 });
    expect(await categoryCounts(db, { includeSecret: false })).toEqual({ diri: 1 });
  });

  it('streak mempertimbangkan hari uzur', async () => {
    await addDeed(db, dek, { day: '2026-09-28', title: 'a', category: 'diri', visibility: 'public' });
    await addDeed(db, dek, { day: DAY, title: 'b', category: 'diri', visibility: 'public' });
    await setUzur(db, '2026-09-29', true);
    await setUzur(db, '2026-09-30', true);
    expect((await loadProgress(db, DAY)).personal.streak).toBe(2);
  });

  it('hapus lokal membersihkan semuanya', async () => {
    await addDeed(db, dek, { day: DAY, title: 'a', category: 'diri', visibility: 'secret' });
    await wipeLocal(db);
    expect(await db.all('SELECT * FROM private_items')).toHaveLength(0);
  });
});

describe('misi', () => {
  it('penugasan idempoten dan penyelesaian membuat catatan amal', async () => {
    const t1 = await ensureAssignments(db, DAY, 'u1', 1);
    const t2 = await ensureAssignments(db, DAY, 'u1', 1);
    expect(t1.daily.map((m) => m.id)).toEqual(t2.daily.map((m) => m.id));
    const rows = await db.all('SELECT * FROM user_missions');
    expect(rows.length).toBeGreaterThanOrEqual(5);
    const m = t1.daily[0]!;
    const vis = m.canBeSecret ? 'secret' : 'public';
    const id = await completeMission(db, { mission: m, day: DAY, visibility: vis, dek });
    expect(id).toBeTruthy();
    await expect(completeMission(db, { mission: m, day: DAY, visibility: vis, dek })).rejects.toThrow(/sudah/);
    const p = await loadProgress(db, DAY);
    expect(p.stats.missionsCompleted).toBe(1);
    expect(p.personal.points).toBe(m.points);
  });

  it('misi yang tidak boleh rahasia ditolak', async () => {
    const m = MISSIONS.find((x) => !x.canBeSecret);
    if (!m) return;
    await expect(completeMission(db, { mission: m, day: DAY, visibility: 'secret', dek })).rejects.toThrow(/rahasia/);
  });
});

describe('batas poin harian lokal', () => {
  it('poin per hari dibatasi 100 (publik & rahasia), seperti server', async () => {
    const db = await createMigratedTestDb();
    const key = generateDek();
    for (let i = 0; i < 6; i++) await addDeed(db, null, { day: DAY, title: `p${i}`, category: 'diri', visibility: 'public', points: 30 });
    for (let i = 0; i < 6; i++) await addDeed(db, key, { day: DAY, title: `s${i}`, category: 'diri', visibility: 'secret', points: 30 });
    await addDeed(db, null, { day: '2026-10-02', title: 'x', category: 'diri', visibility: 'public', points: 10 });
    expect(await pointTotals(db)).toEqual({ publicPoints: 110, secretPoints: 100, secretCount: 6 });
  });
});
