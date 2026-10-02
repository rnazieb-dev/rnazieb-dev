import type { MissionCategory, Tone } from '@/content/types';

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
