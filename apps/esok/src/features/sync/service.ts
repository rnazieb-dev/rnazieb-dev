import type { SupabaseClient } from '@supabase/supabase-js';
import { hydratePrivate } from '@/db/repos';
import type { Db } from '@/db/types';
import { addDays, toDayKey } from '@/lib/dates';
import { reconcileCompletedMissions } from '@/features/missions/service';
import { type SyncResult, syncAll } from './engine';
import { createSupabaseRemote } from './supabaseRemote';

export interface FullSyncResult extends SyncResult {
  awarded: number;
  reconciled: number;
}

/** Minta poin server untuk amal yang DIBAGIKAN (bukan rahasia). Server membatasi & idempoten. */
async function awardSharedDeeds(db: Db, sb: SupabaseClient): Promise<number> {
  const since = addDays(toDayKey(new Date()), -2);
  const rows = await db.all<{ id: string }>(
    `SELECT d.id FROM deeds d LEFT JOIN awarded a ON a.deed_id = d.id
     WHERE d.deleted_at IS NULL AND d.dirty = 0 AND d.points > 0 AND a.deed_id IS NULL AND d.day >= ?`,
    [since],
  );
  let total = 0;
  for (const r of rows) {
    const res = await sb.rpc('award_points_for_deed', { p_deed_id: r.id });
    if (res.error) continue; // mis. misi bersama yang belum dikonfirmasi: dicoba lagi di sync berikutnya
    const pts = Number(res.data ?? 0);
    total += pts;
    await db.run('INSERT OR IGNORE INTO awarded(deed_id, points) VALUES(?, ?)', [r.id, pts]);
  }
  return total;
}

export async function runFullSync(db: Db, sb: SupabaseClient, userId: string, dek: Uint8Array | null): Promise<FullSyncResult> {
  const result = await syncAll(db, createSupabaseRemote(sb, userId));
  if (dek) await hydratePrivate(db, dek);
  const reconciled = await reconcileCompletedMissions(db);
  const awarded = await awardSharedDeeds(db, sb);
  return { ...result, awarded, reconciled };
}
