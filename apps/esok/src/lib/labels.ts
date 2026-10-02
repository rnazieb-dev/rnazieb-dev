import type { MissionCategory, Tone } from '@/content/types';
import type { TKey } from '@/i18n';
import en from '@/i18n/locales/en/missions';

/** Label Indonesia (dipertahankan untuk pemanggil yang belum memakai i18n). */
export const CATEGORY_LABEL: Record<MissionCategory, string> = {
  ibadah: 'Ibadah',
  keluarga: 'Keluarga',
  sedekah: 'Sedekah',
  ilmu: 'Ilmu',
  memaafkan: 'Maaf & Memaafkan',
  lingkungan: 'Lingkungan',
  sosial: 'Sosial',
  diri: 'Diri',
};
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as MissionCategory[];

export const TONE_LABEL: Record<Tone, string> = { khauf: 'Pengingat', raja: 'Harapan', amal: 'Ajakan beramal' };

/** Kunci i18n untuk label kategori/nada/derajat — pakai dengan `t(CATEGORY_KEY[c])`. */
export const CATEGORY_KEY: Record<MissionCategory, TKey> = {
  ibadah: 'missions.categories.ibadah',
  keluarga: 'missions.categories.keluarga',
  sedekah: 'missions.categories.sedekah',
  ilmu: 'missions.categories.ilmu',
  memaafkan: 'missions.categories.memaafkan',
  lingkungan: 'missions.categories.lingkungan',
  sosial: 'missions.categories.sosial',
  diri: 'missions.categories.diri',
};

export const TONE_KEY: Record<Tone, TKey> = { khauf: 'missions.tones.khauf', raja: 'missions.tones.raja', amal: 'missions.tones.amal' };

export type GradeId = keyof typeof en.grades;
export const GRADE_KEY: Record<GradeId, TKey> = { sahih: 'missions.grades.sahih', hasan: 'missions.grades.hasan', quran: 'missions.grades.quran' };
export const gradeKey = (g: string): TKey | null => (g in GRADE_KEY ? GRADE_KEY[g as GradeId] : null);

/** Kunci nama level (lihat LEVELS di gamification/points); null bila level tak dikenal. */
export const levelKey = (n: number): TKey | null => (String(n) in en.levels ? (`missions.levels.${n}` as TKey) : null);

/** Kunci judul/deskripsi lencana menurut id (lihat BADGES); null bila id tak dikenal. */
export const badgeKeys = (id: string): { title: TKey; description: TKey } | null =>
  id in en.badges ? { title: `missions.badges.${id}.title` as TKey, description: `missions.badges.${id}.description` as TKey } : null;
