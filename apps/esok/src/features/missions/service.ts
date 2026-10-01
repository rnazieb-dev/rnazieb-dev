import { MISSIONS } from '@/content';
import type { Mission } from '@/content/types';
import {
  type Visibility,
  addDeed,
  assignMission,
  markMission,
  missionRows,
} from '@/db/repos';
import type { Db } from '@/db/types';
import { type DayKey, weekStart } from '@/lib/dates';
import { type TodaysMissions, missionsForDay } from './engine';

/** Baris misi menyimpan "hari penugasan": mingguan memakai awal pekan. */
export const assignmentDay = (m: Mission, day: DayKey): DayKey => (m.cadence === 'weekly' ? weekStart(day) : day);

export async function ensureAssignments(
  db: Db,
  day: DayKey,
  userSeed: string,
  level: number,
  catalog: readonly Mission[] = MISSIONS,
): Promise<TodaysMissions> {
  const t = missionsForDay(catalog, day, userSeed, level);
  const all = [...t.daily, ...t.weekly, ...t.seasonal, ...(t.side ? [t.side] : [])];
  for (const m of all) await assignMission(db, m, assignmentDay(m, day));
  return t;
}

export interface CompleteInput {
  mission: Mission;
  day: DayKey;
  visibility: Visibility;
  circleId?: string | null;
  sharedId?: string | null;
  note?: string;
  dek: Uint8Array | null;
}

/**
 * Selesaikan misi → membuat catatan amal dengan visibilitas pilihan pengguna.
 * Misi yang belum pernah ditugaskan (mis. dari katalog) tetap boleh diselesaikan.
 */
export async function completeMission(db: Db, input: CompleteInput): Promise<string> {
  const { mission, day, visibility } = input;
  if (visibility === 'secret' && !mission.canBeSecret) throw new Error('Misi ini tidak dapat dijadikan rahasia.');
  const aday = assignmentDay(mission, day);
  const existing = (await missionRows(db, [aday])).find((r) => r.mission_id === mission.id);
  if (existing?.status === 'done') throw new Error('Misi ini sudah diselesaikan.');
  if (!existing) await assignMission(db, mission, aday);
  const deedId = await addDeed(db, input.dek, {
    day,
    title: mission.title,
    note: input.note ?? '',
    category: mission.category,
    visibility,
    circleId: input.circleId ?? null,
    missionId: mission.id,
    sharedId: input.sharedId ?? null,
    points: mission.points,
  });
  await markMission(db, mission.id, aday, 'done', deedId);
  return deedId;
}

export async function skipMission(db: Db, mission: Mission, day: DayKey): Promise<void> {
  const aday = assignmentDay(mission, day);
  await assignMission(db, mission, aday);
  await markMission(db, mission.id, aday, 'skipped', null);
}

/**
 * Setelah sync/hydrate: tandai misi selesai di perangkat ini berdasarkan amal bermisi
 * yang dibuat di perangkat lain (publik: tabel deeds; rahasia: kolom lokal hasil hydrate).
 */
export async function reconcileCompletedMissions(db: Db, catalog: readonly Mission[] = MISSIONS): Promise<number> {
  const rows = await db.all<{ mission_id: string; day: string; id: string }>(
    `SELECT mission_id, day, id FROM deeds WHERE mission_id IS NOT NULL AND deleted_at IS NULL
     UNION ALL
     SELECT mission_id, day, id FROM private_items WHERE kind = 'deed' AND mission_id IS NOT NULL AND day IS NOT NULL AND deleted_at IS NULL`,
  );
  let n = 0;
  for (const r of rows) {
    const m = catalog.find((x) => x.id === r.mission_id);
    if (!m) continue;
    const aday = assignmentDay(m, r.day);
    await assignMission(db, m, aday);
    const cur = (await missionRows(db, [aday])).find((x) => x.mission_id === m.id);
    if (cur && cur.status !== 'done') {
      await markMission(db, m.id, aday, 'done', r.id);
      n++;
    }
  }
  return n;
}
