import { pendingSharedCount, queuePendingShared, retryPendingShared } from '@/features/missions/pending';
import { createMigratedTestDb } from './helpers/testDb';

describe('antrean tanda-selesai misi bersama', () => {
  it('sukses menghapus; galat sementara tetap tersimpan; galat permanen dibuang; idempoten', async () => {
    const db = await createMigratedTestDb();
    for (const id of ['ok', 'net', 'perm']) await queuePendingShared(db, id);
    await queuePendingShared(db, 'ok');
    expect(await pendingSharedCount(db)).toBe(3);
    const r = await retryPendingShared(db, async (id) => {
      if (id === 'net') throw new Error('Network request failed');
      if (id === 'perm') throw new Error('bukan peserta');
    });
    expect(r).toEqual({ sent: 1, kept: 1, dropped: 1 });
    expect(await pendingSharedCount(db)).toBe(1);
    // percobaan berikutnya berhasil
    expect(await retryPendingShared(db, async () => undefined)).toEqual({ sent: 1, kept: 0, dropped: 0 });
    expect(await pendingSharedCount(db)).toBe(0);
  });
});
