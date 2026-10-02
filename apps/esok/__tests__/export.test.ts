import { addDeed, missionRows, saveReflection } from '@/db/repos';
import { buildExport } from '@/features/export/bundle';
import { generateDek } from '@/features/security/e2ee';
import { reconcileCompletedMissions } from '@/features/missions/service';
import { MISSIONS } from '@/content';
import { createMigratedTestDb } from './helpers/testDb';

describe('ekspor data', () => {
  it('menyertakan amalan rahasia hanya bila kunci tersedia', async () => {
    const db = await createMigratedTestDb();
    const dek = generateDek();
    await addDeed(db, null, { day: '2026-10-01', title: 'publik', category: 'sosial', visibility: 'public', points: 3 });
    await addDeed(db, dek, { day: '2026-10-01', title: 'rahasia', note: 'n', category: 'sedekah', visibility: 'secret', points: 9 });
    await saveReflection(db, dek, '2026-10-01', { niat: 'ikhlas', syukur: 's', penyesalan: 'p', tekad: 't' });
    const locked = await buildExport(db, null);
    expect(locked.deeds).toHaveLength(1);
    expect(locked.secretDeeds).toHaveLength(0);
    expect(JSON.stringify(locked)).not.toContain('rahasia');
    const full = await buildExport(db, dek);
    expect(full.secretDeeds[0]).toMatchObject({ title: 'rahasia', category: 'sedekah', points: 9 });
    expect(full.reflections[0]).toMatchObject({ day: '2026-10-01', niat: 'ikhlas' });
  });
});

describe('rekonsiliasi misi dari amal hasil sync', () => {
  it('menandai misi selesai berdasarkan amal bermisi dari perangkat lain', async () => {
    const db = await createMigratedTestDb();
    const m = MISSIONS.find((x) => x.cadence === 'daily')!;
    await addDeed(db, null, { day: '2026-10-01', title: m.title, category: m.category, visibility: 'public', missionId: m.id, points: m.points });
    expect(await reconcileCompletedMissions(db)).toBe(1);
    const rows = await missionRows(db, ['2026-10-01']);
    expect(rows.find((r) => r.mission_id === m.id)?.status).toBe('done');
    expect(await reconcileCompletedMissions(db)).toBe(0); // idempoten
  });
});
