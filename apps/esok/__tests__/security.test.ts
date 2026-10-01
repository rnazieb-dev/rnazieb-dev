import { addDeed, getReflection, listDeedsForDay, saveReflection } from '@/db/repos';
import { generateDek } from '@/features/security/e2ee';
import { backoffSeconds, createPinRecord, verifyPin } from '@/features/security/lock';
import { rekeyPrivateItems } from '@/features/security/rekey';
import { createMigratedTestDb } from './helpers/testDb';

describe('kunci aplikasi (PIN)', () => {
  const FAST = { t: 1, m: 8, p: 1 };
  it('PIN benar lolos, salah gagal; salt berbeda tiap catatan', async () => {
    const a = await createPinRecord('123456', FAST);
    const b = await createPinRecord('123456', FAST);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(await verifyPin('123456', a)).toBe(true);
    expect(await verifyPin('123457', a)).toBe(false);
  });
  it('hanya menerima 6 digit', async () => {
    await expect(createPinRecord('12345', FAST)).rejects.toThrow();
    await expect(createPinRecord('12345a', FAST)).rejects.toThrow();
  });
  it('jeda bertahap setelah gagal berulang, maksimum 15 menit', () => {
    expect([0, 1, 2].map(backoffSeconds)).toEqual([0, 0, 0]);
    expect(backoffSeconds(3)).toBe(30);
    expect(backoffSeconds(4)).toBe(60);
    expect(backoffSeconds(5)).toBe(120);
    expect(backoffSeconds(50)).toBe(900);
  });
});

describe('rekey item privat (memakai kunci cloud di perangkat baru)', () => {
  it('semua item dapat dibaca dengan kunci baru, kunci lama tidak lagi', async () => {
    const db = await createMigratedTestDb();
    const oldK = generateDek();
    const newK = generateDek();
    await addDeed(db, oldK, { day: '2026-10-01', title: 'doa', category: 'ibadah', visibility: 'secret', points: 5 });
    await saveReflection(db, oldK, '2026-10-01', { niat: 'ikhlas', syukur: '', penyesalan: '', tekad: '' });
    expect(await rekeyPrivateItems(db, oldK, newK)).toBe(2);
    expect((await listDeedsForDay(db, '2026-10-01', newK))[0]?.title).toBe('doa');
    expect((await getReflection(db, newK, '2026-10-01')).niat).toBe('ikhlas');
    await expect(listDeedsForDay(db, '2026-10-01', oldK)).rejects.toThrow();
    // ditandai kotor & rev naik agar tersinkron ulang
    const rows = await db.all<{ rev: number; dirty: number }>('SELECT rev, dirty FROM private_items');
    expect(rows.every((r) => r.rev === 2 && r.dirty === 1)).toBe(true);
  });
});
