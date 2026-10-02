import { MISSIONS } from '@/content';
import { dailyMissions, seasonalMissions, sideQuest, weeklyMissions } from '@/features/missions/engine';
import { gregorianToHijri, activeSeasons } from '@/lib/hijri';
import { weekStart } from '@/lib/dates';

describe('mesin misi', () => {
  it('deterministik per hari+pengguna, 3 misi harian berkategori berbeda', () => {
    const a = dailyMissions(MISSIONS, '2026-10-01', 'u1', 3);
    const b = dailyMissions(MISSIONS, '2026-10-01', 'u1', 3);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
    expect(a).toHaveLength(3);
    expect(new Set(a.map((m) => m.category)).size).toBe(3);
    expect(a.every((m) => m.cadence === 'daily')).toBe(true);
  });
  it('berbeda antar hari/pengguna (peluang bertabrakan kecil)', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
    const sets = new Set(days.map((d) => dailyMissions(MISSIONS, d, 'u1', 3).map((m) => m.id).join(',')));
    expect(sets.size).toBeGreaterThan(1);
  });
  it('kesulitan mengikuti level', () => {
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) {
      expect(dailyMissions(MISSIONS, d, 'u', 1).every((m) => m.difficulty === 1)).toBe(true);
    }
  });
  it('mingguan stabil sepanjang pekan', () => {
    const mon = weeklyMissions(MISSIONS, '2026-09-28', 'u1', 3).map((m) => m.id);
    const sun = weeklyMissions(MISSIONS, '2026-10-04', 'u1', 3).map((m) => m.id);
    expect(weekStart('2026-10-04')).toBe('2026-09-28');
    expect(mon).toEqual(sun);
  });
  it('side quest: sebagian hari saja, bukan undian hadiah', () => {
    let shown = 0;
    for (let i = 1; i <= 28; i++) {
      const day = `2026-11-${String(i).padStart(2, '0')}`;
      const s = sideQuest(MISSIONS, day, 'u1', 3);
      if (s) {
        shown++;
        expect(s.cadence).toBe('side');
      }
    }
    expect(shown).toBeGreaterThan(5);
    expect(shown).toBeLessThan(28);
  });
  it('musiman: Jumat & Senin/Kamis aktif sesuai hari', () => {
    // 2026-10-02 = Jumat
    expect(seasonalMissions(MISSIONS, '2026-10-02').some((m) => m.season === 'jumat')).toBe(true);
    expect(seasonalMissions(MISSIONS, '2026-10-01').some((m) => m.season === 'senin_kamis')).toBe(true); // Kamis
    expect(activeSeasons('2026-10-03')).not.toContain('jumat');
  });
});

describe('kalender hijriah (tabular, perkiraan)', () => {
  it('konversi wajar (toleransi ±2 hari)', () => {
    // 1 Ramadan 1447 H ≈ 18/19 Feb 2026
    const h = gregorianToHijri(new Date(2026, 1, 19));
    expect(h.year).toBe(1447);
    expect(h.month).toBe(9);
    expect(h.day).toBeLessThanOrEqual(3);
    const r = activeSeasons('2026-03-01');
    expect(r).toContain('ramadan');
  });
});
