import type { Db } from '@/db/types';
import { decryptItem, encryptItem } from '@/features/security/e2ee';
import { type DayKey, addDays, toDayKey } from '@/lib/dates';
import { uuid } from '@/lib/random';
import type { LedgerPayload, LedgerType, LedgerView } from './types';

/** Waktu kasar (hari) untuk metadata yang dikirim ke server, sama seperti item rahasia lain. */
const coarseIso = () => `${toDayKey(new Date())}T00:00:00.000Z`;

/** Hanya utang/piutang/amanah yang belum selesai dan punya jatuh tempo yang "terbuka". */
export const isOpen = (p: Pick<LedgerPayload, 'type' | 'settled'>): boolean => p.type !== 'wasiat' && !p.settled;

function normalize(p: LedgerPayload): LedgerPayload {
  const wasiat = p.type === 'wasiat';
  return {
    ...p,
    title: p.title.trim(),
    counterparty: p.counterparty.trim(),
    note: p.note.trim(),
    amountIdr: wasiat ? null : p.amountIdr,
    dueDay: wasiat ? null : p.dueDay,
  };
}

/** Simpan (baru atau ubah). Mengembalikan id. Butuh DEK (vault terbuka). */
export async function saveLedgerItem(db: Db, dek: Uint8Array, payload: LedgerPayload, id?: string): Promise<string> {
  const p = normalize(payload);
  if (!p.title) throw new Error('Judul wajib diisi.');
  const rowId = id ?? uuid();
  const s = encryptItem(dek, rowId, 'ledger', p);
  const existing = id ? await db.get<{ rev: number }>('SELECT rev FROM private_items WHERE id = ? AND kind = ?', [id, 'ledger']) : undefined;
  if (existing) {
    await db.run(
      `UPDATE private_items SET ciphertext = ?, nonce = ?, due_day = ?, open = ?, day = ?, rev = rev + 1,
         updated_at = ?, deleted_at = NULL, dirty = 1 WHERE id = ?`,
      [s.ciphertext, s.nonce, p.dueDay, isOpen(p) ? 1 : 0, p.createdDay, coarseIso(), rowId],
    );
  } else {
    await db.run(
      `INSERT INTO private_items(id, kind, day, points, due_day, open, ciphertext, nonce, rev, updated_at, dirty)
       VALUES(?, 'ledger', ?, 0, ?, ?, ?, ?, 1, ?, 1)`,
      [rowId, p.createdDay, p.dueDay, isOpen(p) ? 1 : 0, s.ciphertext, s.nonce, coarseIso()],
    );
  }
  return rowId;
}

export async function deleteLedgerItem(db: Db, id: string): Promise<void> {
  await db.run(
    `UPDATE private_items SET deleted_at = ?, updated_at = ?, rev = rev + 1, open = 0, dirty = 1 WHERE id = ? AND kind = 'ledger'`,
    [coarseIso(), coarseIso(), id],
  );
}

/** Tandai lunas/selesai (atau batalkan). */
export async function settleLedgerItem(db: Db, dek: Uint8Array, id: string, settled: boolean, today: DayKey): Promise<void> {
  const cur = (await listLedger(db, dek)).find((x) => x.id === id);
  if (!cur) throw new Error('Catatan tidak ditemukan.');
  const { id: _id, ...payload } = cur;
  void _id;
  await saveLedgerItem(db, dek, { ...payload, settled, settledDay: settled ? today : null }, id);
}

/** Daftar terdekripsi: yang masih terbuka dulu (jatuh tempo terdekat), lalu selesai, wasiat terakhir diubah. */
export async function listLedger(db: Db, dek: Uint8Array): Promise<LedgerView[]> {
  const rows = await db.all<{ id: string; ciphertext: string; nonce: string }>(
    `SELECT id, ciphertext, nonce FROM private_items WHERE kind = 'ledger' AND deleted_at IS NULL`,
  );
  const items = rows.map((r) => ({ id: r.id, ...decryptItem<LedgerPayload>(dek, r.id, 'ledger', r) }));
  const rank = (x: LedgerView) => (x.type === 'wasiat' ? 2 : x.settled ? 1 : 0);
  return items.sort((a, b) => rank(a) - rank(b) || (a.dueDay ?? '9999').localeCompare(b.dueDay ?? '9999') || b.createdDay.localeCompare(a.createdDay));
}

export async function countLedger(db: Db): Promise<{ total: number; open: number }> {
  const r = await db.get<{ total: number; open: number | null }>(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN open = 1 THEN 1 ELSE 0 END) AS open FROM private_items WHERE kind = 'ledger' AND deleted_at IS NULL`,
  );
  return { total: r?.total ?? 0, open: r?.open ?? 0 };
}

/** Tanpa membuka vault: hitung catatan terbuka yang lewat/akan jatuh tempo (dari kolom lokal due_day). */
export async function dueCounts(db: Db, today: DayKey, withinDays = 7): Promise<{ overdue: number; soon: number }> {
  const r = await db.get<{ overdue: number | null; soon: number | null }>(
    `SELECT SUM(CASE WHEN due_day < ? THEN 1 ELSE 0 END) AS overdue,
            SUM(CASE WHEN due_day >= ? AND due_day <= ? THEN 1 ELSE 0 END) AS soon
     FROM private_items WHERE kind = 'ledger' AND open = 1 AND deleted_at IS NULL AND due_day IS NOT NULL`,
    [today, today, addDays(today, withinDays)],
  );
  return { overdue: r?.overdue ?? 0, soon: r?.soon ?? 0 };
}

/** Hari jatuh tempo (unik) dalam rentang — untuk menjadwalkan pengingat generik. */
export async function dueDaysBetween(db: Db, from: DayKey, to: DayKey): Promise<DayKey[]> {
  const rows = await db.all<{ due_day: string }>(
    `SELECT DISTINCT due_day FROM private_items WHERE kind = 'ledger' AND open = 1 AND deleted_at IS NULL
       AND due_day IS NOT NULL AND due_day >= ? AND due_day <= ? ORDER BY due_day`,
    [from, to],
  );
  return rows.map((r) => r.due_day);
}

export const LEDGER_TYPES: LedgerType[] = ['utang', 'piutang', 'amanah', 'wasiat'];
