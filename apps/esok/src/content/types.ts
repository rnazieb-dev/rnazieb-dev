export type Tone = 'khauf' | 'raja' | 'amal';
export type Grade = 'sahih' | 'hasan' | 'quran';

export interface Quote {
  id: string;
  kind: 'quran' | 'hadith' | 'renungan';
  tone: Tone;
  theme: string;
  /** Teks Arab (hanya Al-Qur'an; diambil dari data Mushaf, tidak diketik ulang). */
  arabic?: string;
  /** Teks/terjemah Indonesia. */
  text: string;
  /** Sumber yang dapat diperiksa, mis. "QS Ali 'Imran 3:185" atau "HR. Tirmidzi no. 2307". */
  source?: string;
  grade?: Grade;
  note?: string;
}

export type MissionCategory =
  | 'ibadah'
  | 'keluarga'
  | 'sedekah'
  | 'ilmu'
  | 'memaafkan'
  | 'lingkungan'
  | 'sosial'
  | 'diri';

export type MissionCadence = 'daily' | 'weekly' | 'seasonal' | 'side';
export type Season = 'jumat' | 'ramadan' | 'sepuluh_dzulhijjah' | 'arafah' | 'asyura' | 'senin_kamis';

export interface MissionDalil {
  source: string;
  grade: Grade;
  gist: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  cadence: MissionCadence;
  season?: Season;
  difficulty: 1 | 2 | 3;
  points: number;
  dalil: MissionDalil | null;
  canBeSecret: boolean;
  canBeShared: boolean;
  minPeople?: number;
  estimateMinutes: number;
}

export type AdhkarGroup = 'pagi' | 'petang' | 'pagi_petang' | 'tidur' | 'harian' | 'kematian';

/**
 * Dzikir/doa bersumber. Teks Arab HANYA untuk ayat Al-Qur'an (diambil dari data Mushaf);
 * doa dari hadis memuat terjemah + sumber + derajat (teks Arab dirujuk dari kitab, menunggu data terverifikasi).
 */
export interface Adhkar {
  id: string;
  group: AdhkarGroup;
  title: string;
  kind: 'quran' | 'hadith';
  arabic?: string;
  meaning: string;
  source: string;
  grade: Grade;
  /** Jumlah bacaan HANYA bila disebut dalam dalil (lihat countSource). */
  count?: number;
  countSource?: string;
  note?: string;
}
