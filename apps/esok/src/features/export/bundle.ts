import type { Reflection } from '@/db/repos';
import type { Db } from '@/db/types';
import { decryptItem } from '@/features/security/e2ee';

export interface ExportBundle {
  app: 'esok';
  version: 1;
  exportedAt: string;
  deeds: { id: string; day: string; title: string; note: string; category: string; visibility: string; missionId: string | null; points: number }[];
  secretDeeds: { id: string; day: string; title: string; note: string; category: string; missionId: string | null; points: number }[];
  reflections: ({ day: string } & Reflection)[];
}

/** Ekspor SEMUA data milik pengguna. Item rahasia didekripsi lokal (butuh DEK); berkas ekspor TIDAK terenkripsi. */
export async function buildExport(db: Db, dek: Uint8Array | null): Promise<ExportBundle> {
  const pub = await db.all<{ id: string; day: string; title: string; note: string; category: string; visibility: string; mission_id: string | null; points: number }>(
    `SELECT id, day, title, note, category, visibility, mission_id, points FROM deeds WHERE deleted_at IS NULL ORDER BY day, created_at`,
  );
  const bundle: ExportBundle = {
    app: 'esok',
    version: 1,
    exportedAt: new Date().toISOString(),
    deeds: pub.map((d) => ({ id: d.id, day: d.day, title: d.title, note: d.note, category: d.category, visibility: d.visibility, missionId: d.mission_id, points: d.points })),
    secretDeeds: [],
    reflections: [],
  };
  if (dek) {
    const priv = await db.all<{ id: string; kind: 'deed' | 'reflection'; ciphertext: string; nonce: string }>(
      `SELECT id, kind, ciphertext, nonce FROM private_items WHERE deleted_at IS NULL ORDER BY id`,
    );
    for (const r of priv) {
      const p = decryptItem<Record<string, unknown>>(dek, r.id, r.kind, r);
      if (r.kind === 'deed') {
        bundle.secretDeeds.push({
          id: r.id, day: String(p.day), title: String(p.title), note: String(p.note ?? ''), category: String(p.category),
          missionId: (p.missionId as string | null) ?? null, points: Number(p.points ?? 0),
        });
      } else {
        bundle.reflections.push({ day: String(p.day), niat: String(p.niat ?? ''), syukur: String(p.syukur ?? ''), penyesalan: String(p.penyesalan ?? ''), tekad: String(p.tekad ?? '') });
      }
    }
  }
  return bundle;
}
