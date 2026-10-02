import type { Mission, MissionCategory } from '@/content/types';
import { decryptItem, encryptItem } from '@/features/security/e2ee';
import { type DayKey, toDayKey } from '@/lib/dates';
import { uuid } from '@/lib/random';
import type { Db } from './types';

const nowIso = () => new Date().toISOString();
/** Waktu "kasar" (hari) untuk item rahasia agar server tidak tahu jam pasti. */
const coarseIso = () => `${toDayKey(new Date())}T00:00:00.000Z`;

// ---------------- settings ----------------
export async function getSetting<T>(db: Db, key: string, fallback: T): Promise<T> {
  const row = await db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(db: Db, key: string, value: T): Promise<void> {
  await db.run('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    JSON.stringify(value),
  ]);
}

// ---------------- deeds ----------------
export type Visibility = 'secret' | 'circle' | 'public';

export interface DeedInput {
  day: DayKey;
  title: string;
  note?: string;
  category: MissionCategory;
  visibility: Visibility;
  circleId?: string | null;
  missionId?: string | null;
  sharedId?: string | null;
  points?: number;
}

export interface DeedView {
  id: string;
  secret: boolean;
  /** Item rahasia saat vault terkunci: locked=true dan title/note kosong. */
  locked: boolean;
  day: DayKey;
  title: string;
  note: string;
  category: MissionCategory | null;
  visibility: Visibility;
  circleId: string | null;
  missionId: string | null;
  points: number;
}

interface SecretPayload {
  title: string;
  note: string;
  category: MissionCategory;
  day: DayKey;
  missionId: string | null;
  points: number;
}

/** Tambah amal. Rahasia → ciphertext (butuh DEK); lainnya → tabel deeds. */
export async function addDeed(db: Db, dek: Uint8Array | null, input: DeedInput): Promise<string> {
  const id = uuid();
  const points = input.points ?? 0;
  if (input.visibility === 'secret') {
    if (!dek) throw new Error('Vault terkunci: tidak dapat menyimpan amalan rahasia.');
    const payload: SecretPayload = {
      title: input.title,
      note: input.note ?? '',
      category: input.category,
      day: input.day,
      missionId: input.missionId ?? null,
      points,
    };
    const s = encryptItem(dek, id, 'deed', payload);
    await db.run(
      `INSERT INTO private_items(id, kind, day, points, category, mission_id, ciphertext, nonce, rev, updated_at, dirty)
       VALUES(?, 'deed', ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
      [id, input.day, points, input.category, input.missionId ?? null, s.ciphertext, s.nonce, coarseIso()],
    );
    return id;
  }
  if (input.visibility === 'circle' && !input.circleId) throw new Error('Pilih lingkaran untuk amal yang dibagikan ke lingkaran.');
  const t = nowIso();
  await db.run(
    `INSERT INTO deeds(id, day, title, note, category, visibility, circle_id, mission_id, shared_id, points, created_at, updated_at, dirty)
     VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      id,
      input.day,
      input.title,
      input.note ?? '',
      input.category,
      input.visibility,
      input.visibility === 'circle' ? (input.circleId ?? null) : null,
      input.missionId ?? null,
      input.sharedId ?? null,
      points,
      t,
      t,
    ],
  );
  return id;
}

export async function deleteDeed(db: Db, id: string): Promise<void> {
  await db.run('UPDATE deeds SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?', [nowIso(), nowIso(), id]);
  await db.run(
    `UPDATE private_items SET deleted_at = ?, updated_at = ?, rev = rev + 1, dirty = 1
       WHERE id = ? AND kind = 'deed'`,
    [coarseIso(), coarseIso(), id],
  );
}

interface DeedRow {
  id: string; day: string; title: string; note: string; category: MissionCategory;
  visibility: 'circle' | 'public'; circle_id: string | null; mission_id: string | null; points: number;
}
interface PrivRow {
  id: string; day: string | null; points: number; category: MissionCategory | null; mission_id: string | null;
  ciphertext: string; nonce: string;
}

export async function listDeedsForDay(db: Db, day: DayKey, dek: Uint8Array | null): Promise<DeedView[]> {
  const pub = await db.all<DeedRow>(
    `SELECT id, day, title, note, category, visibility, circle_id, mission_id, points
     FROM deeds WHERE day = ? AND deleted_at IS NULL ORDER BY created_at`,
    [day],
  );
  const priv = await db.all<PrivRow>(
    `SELECT id, day, points, category, mission_id, ciphertext, nonce
     FROM private_items WHERE kind = 'deed' AND day = ? AND deleted_at IS NULL ORDER BY updated_at, id`,
    [day],
  );
  const out: DeedView[] = pub.map((r) => ({
    id: r.id, secret: false, locked: false, day: r.day, title: r.title, note: r.note, category: r.category,
    visibility: r.visibility, circleId: r.circle_id, missionId: r.mission_id, points: r.points,
  }));
  for (const r of priv) {
    if (!dek) {
      out.push({ id: r.id, secret: true, locked: true, day, title: '', note: '', category: null, visibility: 'secret', circleId: null, missionId: null, points: r.points });
      continue;
    }
    const p = decryptItem<SecretPayload>(dek, r.id, 'deed', { ciphertext: r.ciphertext, nonce: r.nonce });
    out.push({
      id: r.id, secret: true, locked: false, day, title: p.title, note: p.note, category: p.category,
      visibility: 'secret', circleId: null, missionId: p.missionId, points: p.points,
    });
  }
  return out;
}

/** Semua amalan rahasia (terbaru dulu). Terkunci → hanya jumlah/metadata. */
export async function listSecretDeeds(db: Db, dek: Uint8Array | null): Promise<DeedView[]> {
  const rows = await db.all<PrivRow & { day: string }>(
    `SELECT id, day, points, category, mission_id, ciphertext, nonce FROM private_items
     WHERE kind = 'deed' AND day IS NOT NULL AND deleted_at IS NULL ORDER BY day DESC, updated_at DESC, id`,
  );
  return rows.map((r) => {
    if (!dek) {
      return { id: r.id, secret: true, locked: true, day: r.day, title: '', note: '', category: null, visibility: 'secret' as const, circleId: null, missionId: null, points: r.points };
    }
    const p = decryptItem<SecretPayload>(dek, r.id, 'deed', { ciphertext: r.ciphertext, nonce: r.nonce });
    return { id: r.id, secret: true, locked: false, day: r.day, title: p.title, note: p.note, category: p.category, visibility: 'secret' as const, circleId: null, missionId: p.missionId, points: p.points };
  });
}

/** Isi kolom lokal (day/points/category/mission_id) untuk item hasil pull dari perangkat lain. */
export async function hydratePrivate(db: Db, dek: Uint8Array): Promise<number> {
  const rows = await db.all<PrivRow & { kind: 'deed' | 'reflection' | 'ledger' }>(
    `SELECT id, kind, day, points, category, mission_id, ciphertext, nonce FROM private_items
     WHERE day IS NULL AND deleted_at IS NULL`,
  );
  let n = 0;
  for (const r of rows) {
    if (r.kind === 'deed') {
      const p = decryptItem<SecretPayload>(dek, r.id, 'deed', { ciphertext: r.ciphertext, nonce: r.nonce });
      await db.run('UPDATE private_items SET day = ?, points = ?, category = ?, mission_id = ? WHERE id = ?', [
        p.day, p.points, p.category, p.missionId, r.id,
      ]);
    } else if (r.kind === 'ledger') {
      const p = decryptItem<{ createdDay: DayKey; dueDay: DayKey | null; type: string; settled: boolean }>(dek, r.id, 'ledger', {
        ciphertext: r.ciphertext,
        nonce: r.nonce,
      });
      const open = p.type !== 'wasiat' && !p.settled ? 1 : 0;
      await db.run('UPDATE private_items SET day = ?, due_day = ?, open = ? WHERE id = ?', [p.createdDay, p.dueDay, open, r.id]);
    } else {
      const p = decryptItem<{ day: DayKey }>(dek, r.id, 'reflection', { ciphertext: r.ciphertext, nonce: r.nonce });
      await db.run('UPDATE private_items SET day = ? WHERE id = ?', [p.day, r.id]);
    }
    n++;
  }
  return n;
}

// ---------------- refleksi (niat pagi, muhasabah malam) ----------------
export interface Reflection {
  niat: string;
  syukur: string;
  penyesalan: string;
  tekad: string;
}
export const EMPTY_REFLECTION: Reflection = { niat: '', syukur: '', penyesalan: '', tekad: '' };
const reflectionId = (day: DayKey) => `refl:${day}`;

export async function saveReflection(db: Db, dek: Uint8Array, day: DayKey, r: Reflection): Promise<void> {
  const id = reflectionId(day);
  const existing = await db.get<{ rev: number }>('SELECT rev FROM private_items WHERE id = ?', [id]);
  const s = encryptItem(dek, id, 'reflection', { day, ...r });
  if (existing) {
    await db.run(
      `UPDATE private_items SET ciphertext = ?, nonce = ?, rev = rev + 1, updated_at = ?, deleted_at = NULL, dirty = 1 WHERE id = ?`,
      [s.ciphertext, s.nonce, coarseIso(), id],
    );
  } else {
    await db.run(
      `INSERT INTO private_items(id, kind, day, points, ciphertext, nonce, rev, updated_at, dirty)
       VALUES(?, 'reflection', ?, 0, ?, ?, 1, ?, 1)`,
      [id, day, s.ciphertext, s.nonce, coarseIso()],
    );
  }
}

export async function getReflection(db: Db, dek: Uint8Array, day: DayKey): Promise<Reflection> {
  const id = reflectionId(day);
  const row = await db.get<{ ciphertext: string; nonce: string }>(
    'SELECT ciphertext, nonce FROM private_items WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  if (!row) return { ...EMPTY_REFLECTION };
  const p = decryptItem<Reflection & { day: DayKey }>(dek, id, 'reflection', row);
  return { niat: p.niat, syukur: p.syukur, penyesalan: p.penyesalan, tekad: p.tekad };
}

export async function hasReflectionContent(db: Db, day: DayKey): Promise<boolean> {
  const row = await db.get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM private_items WHERE id = ? AND deleted_at IS NULL`,
    [reflectionId(day)],
  );
  return (row?.c ?? 0) > 0;
}

// ---------------- aktivitas, statistik ----------------
export async function activityDays(db: Db, opts: { includeSecret: boolean }): Promise<Set<DayKey>> {
  const rows = await db.all<{ day: string }>(`SELECT DISTINCT day FROM deeds WHERE deleted_at IS NULL`);
  const set = new Set(rows.map((r) => r.day));
  if (opts.includeSecret) {
    const s = await db.all<{ day: string }>(
      `SELECT DISTINCT day FROM private_items WHERE kind = 'deed' AND day IS NOT NULL AND deleted_at IS NULL`,
    );
    for (const r of s) set.add(r.day);
  }
  return set;
}

export async function uzurDays(db: Db): Promise<Set<DayKey>> {
  const rows = await db.all<{ day: string }>('SELECT day FROM uzur_days');
  return new Set(rows.map((r) => r.day));
}

export async function setUzur(db: Db, day: DayKey, on: boolean): Promise<void> {
  if (on) await db.run('INSERT OR IGNORE INTO uzur_days(day) VALUES(?)', [day]);
  else await db.run('DELETE FROM uzur_days WHERE day = ?', [day]);
}

export interface PointTotals {
  publicPoints: number;
  secretPoints: number;
  secretCount: number;
}

/** Batas poin per hari (sama dengan batas server) agar skor lokal tidak bisa "dikebut". */
export const DAILY_POINT_CAP = 100;
const cappedSum = (rows: { s: number | null }[]) => rows.reduce((t, r) => t + Math.min(DAILY_POINT_CAP, r.s ?? 0), 0);

export async function pointTotals(db: Db): Promise<PointTotals> {
  const pub = await db.all<{ s: number | null }>(`SELECT SUM(points) AS s FROM deeds WHERE deleted_at IS NULL GROUP BY day`);
  const sec = await db.all<{ s: number | null; c: number }>(
    `SELECT SUM(points) AS s, COUNT(*) AS c FROM private_items WHERE kind = 'deed' AND deleted_at IS NULL GROUP BY day`,
  );
  return { publicPoints: cappedSum(pub), secretPoints: cappedSum(sec), secretCount: sec.reduce((t, r) => t + r.c, 0) };
}

export async function categoryCounts(db: Db, opts: { includeSecret: boolean }): Promise<Partial<Record<MissionCategory, number>>> {
  const out: Partial<Record<MissionCategory, number>> = {};
  const pub = await db.all<{ category: MissionCategory; c: number }>(
    `SELECT category, COUNT(*) AS c FROM deeds WHERE deleted_at IS NULL GROUP BY category`,
  );
  for (const r of pub) out[r.category] = (out[r.category] ?? 0) + r.c;
  if (opts.includeSecret) {
    const sec = await db.all<{ category: MissionCategory | null; c: number }>(
      `SELECT category, COUNT(*) AS c FROM private_items WHERE kind = 'deed' AND category IS NOT NULL AND deleted_at IS NULL GROUP BY category`,
    );
    for (const r of sec) if (r.category) out[r.category] = (out[r.category] ?? 0) + r.c;
  }
  return out;
}

// ---------------- misi ----------------
export type MissionStatus = 'active' | 'done' | 'skipped';
export interface UserMissionRow {
  id: string;
  mission_id: string;
  day: DayKey;
  status: MissionStatus;
  completed_at: string | null;
  deed_id: string | null;
}

export async function assignMission(db: Db, mission: Mission, day: DayKey): Promise<void> {
  await db.run('INSERT OR IGNORE INTO user_missions(id, mission_id, day, status) VALUES(?, ?, ?, ?)', [
    uuid(), mission.id, day, 'active',
  ]);
}

export async function missionRows(db: Db, days: DayKey[]): Promise<UserMissionRow[]> {
  if (days.length === 0) return [];
  return db.all<UserMissionRow>(
    `SELECT id, mission_id, day, status, completed_at, deed_id FROM user_missions WHERE day IN (${days.map(() => '?').join(',')})`,
    days,
  );
}

export async function markMission(db: Db, mission_id: string, day: DayKey, status: MissionStatus, deedId: string | null): Promise<void> {
  await db.run('UPDATE user_missions SET status = ?, completed_at = ?, deed_id = ? WHERE mission_id = ? AND day = ?', [
    status, status === 'done' ? nowIso() : null, deedId, mission_id, day,
  ]);
}

/**
 * total = misi berstatus selesai; shared = amal yang benar-benar terikat misi bersama DAN poinnya sudah
 * diberikan server (artinya dikonfirmasi sejawat). Misi "bisa bersama" yang dikerjakan solo tidak dihitung.
 */
export async function completedMissionCounts(db: Db): Promise<{ total: number; shared: number }> {
  const done = await db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM user_missions WHERE status = 'done'`);
  const shared = await db.get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM deeds d JOIN awarded a ON a.deed_id = d.id
     WHERE d.shared_id IS NOT NULL AND d.deleted_at IS NULL AND a.points > 0`,
  );
  return { total: done?.c ?? 0, shared: shared?.c ?? 0 };
}

// ---------------- kutipan yang sudah dilihat ----------------
export async function markQuoteSeen(db: Db, quoteId: string): Promise<void> {
  await db.run('INSERT INTO quotes_seen(quote_id, seen_at) VALUES(?, ?)', [quoteId, nowIso()]);
}
export async function recentQuoteIds(db: Db, limit = 40): Promise<string[]> {
  const rows = await db.all<{ quote_id: string }>('SELECT quote_id FROM quotes_seen ORDER BY seen_at DESC LIMIT ?', [limit]);
  return rows.map((r) => r.quote_id);
}

// ---------------- hapus semua data lokal ----------------
export async function wipeLocal(db: Db): Promise<void> {
  await db.transaction(async () => {
    for (const t of ['deeds', 'private_items', 'user_missions', 'uzur_days', 'quotes_seen', 'badges_earned', 'sync_state', 'awarded', 'pending_shared', 'settings']) {
      await db.run(`DELETE FROM ${t}`);
    }
  });
}
