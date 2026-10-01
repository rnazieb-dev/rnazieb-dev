import type { Db } from '@/db/types';

export async function queuePendingShared(db: Db, sharedId: string): Promise<void> {
  await db.run('INSERT OR IGNORE INTO pending_shared(shared_id) VALUES(?)', [sharedId]);
}

export async function pendingSharedCount(db: Db): Promise<number> {
  return (await db.get<{ c: number }>('SELECT COUNT(*) AS c FROM pending_shared'))?.c ?? 0;
}

/** Galat permanen (mis. bukan peserta): jangan diulang agar antrean tidak tersumbat. */
const PERMANENT = /bukan peserta|tidak ditemukan/i;

/**
 * Kirim ulang "tandai selesai" yang tertunda. Sukses → dihapus dari antrean; galat sementara (jaringan) →
 * tetap tersimpan; galat permanen → dibuang.
 */
export async function retryPendingShared(
  db: Db,
  mark: (sharedId: string) => Promise<void>,
): Promise<{ sent: number; kept: number; dropped: number }> {
  const rows = await db.all<{ shared_id: string }>('SELECT shared_id FROM pending_shared');
  let sent = 0;
  let kept = 0;
  let dropped = 0;
  for (const r of rows) {
    try {
      await mark(r.shared_id);
      await db.run('DELETE FROM pending_shared WHERE shared_id = ?', [r.shared_id]);
      sent++;
    } catch (e) {
      if (PERMANENT.test(e instanceof Error ? e.message : String(e))) {
        await db.run('DELETE FROM pending_shared WHERE shared_id = ?', [r.shared_id]);
        dropped++;
      } else {
        kept++;
      }
    }
  }
  return { sent, kept, dropped };
}
