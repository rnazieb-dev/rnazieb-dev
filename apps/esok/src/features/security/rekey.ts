import type { Db } from '@/db/types';
import { decryptItem, encryptItem } from './e2ee';

/** Enkripsi ulang semua item privat lokal dengan kunci baru (mis. saat memakai kunci dari cloud). */
export async function rekeyPrivateItems(db: Db, oldDek: Uint8Array, newDek: Uint8Array): Promise<number> {
  const rows = await db.all<{ id: string; kind: 'deed' | 'reflection'; ciphertext: string; nonce: string }>(
    'SELECT id, kind, ciphertext, nonce FROM private_items',
  );
  await db.transaction(async () => {
    for (const r of rows) {
      const payload = decryptItem<unknown>(oldDek, r.id, r.kind, r);
      const s = encryptItem(newDek, r.id, r.kind, payload);
      await db.run('UPDATE private_items SET ciphertext = ?, nonce = ?, rev = rev + 1, dirty = 1 WHERE id = ?', [
        s.ciphertext,
        s.nonce,
        r.id,
      ]);
    }
  });
  return rows.length;
}
