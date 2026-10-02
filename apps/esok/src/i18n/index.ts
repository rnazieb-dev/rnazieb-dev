import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import en, { type Dict } from './en';
import id from './id';
import ar from './locales/ar';
import az from './locales/az';
import bn from './locales/bn';
import bs from './locales/bs';
import de from './locales/de';
import es from './locales/es';
import fa from './locales/fa';
import fr from './locales/fr';
import ha from './locales/ha';
import hi from './locales/hi';
import kk from './locales/kk';
import ms from './locales/ms';
import nl from './locales/nl';
import ps from './locales/ps';
import ru from './locales/ru';
import so from './locales/so';
import sq from './locales/sq';
import sw from './locales/sw';
import th from './locales/th';
import tl from './locales/tl';
import tr from './locales/tr';
import ur from './locales/ur';
import uz from './locales/uz';
import yo from './locales/yo';
import zh from './locales/zh';

interface LangInfo {
  /** Nama bahasa dalam bahasanya sendiri. */
  label: string;
  dict: Dict;
  rtl: boolean;
  /** Tag BCP-47 untuk format tanggal. */
  locale: string;
}

export const LANGUAGES = {
  en: { label: 'English', dict: en, rtl: false, locale: 'en' },
  id: { label: 'Bahasa Indonesia', dict: id, rtl: false, locale: 'id' },
  ar: { label: 'العربية', dict: ar, rtl: true, locale: 'ar' },
  ur: { label: 'اردو', dict: ur, rtl: true, locale: 'ur' },
  fa: { label: 'فارسی', dict: fa, rtl: true, locale: 'fa' },
  ps: { label: 'پښتو', dict: ps, rtl: true, locale: 'ps' },
  bn: { label: 'বাংলা', dict: bn, rtl: false, locale: 'bn' },
  hi: { label: 'हिन्दी', dict: hi, rtl: false, locale: 'hi' },
  ms: { label: 'Bahasa Melayu', dict: ms, rtl: false, locale: 'ms' },
  tr: { label: 'Türkçe', dict: tr, rtl: false, locale: 'tr' },
  az: { label: 'Azərbaycan', dict: az, rtl: false, locale: 'az' },
  uz: { label: 'Oʻzbek', dict: uz, rtl: false, locale: 'uz' },
  kk: { label: 'Қазақ', dict: kk, rtl: false, locale: 'kk' },
  ru: { label: 'Русский', dict: ru, rtl: false, locale: 'ru' },
  fr: { label: 'Français', dict: fr, rtl: false, locale: 'fr' },
  de: { label: 'Deutsch', dict: de, rtl: false, locale: 'de' },
  es: { label: 'Español', dict: es, rtl: false, locale: 'es' },
  nl: { label: 'Nederlands', dict: nl, rtl: false, locale: 'nl' },
  sq: { label: 'Shqip', dict: sq, rtl: false, locale: 'sq' },
  bs: { label: 'Bosanski', dict: bs, rtl: false, locale: 'bs' },
  sw: { label: 'Kiswahili', dict: sw, rtl: false, locale: 'sw' },
  ha: { label: 'Hausa', dict: ha, rtl: false, locale: 'ha' },
  so: { label: 'Soomaali', dict: so, rtl: false, locale: 'so' },
  yo: { label: 'Yorùbá', dict: yo, rtl: false, locale: 'yo' },
  zh: { label: '中文', dict: zh, rtl: false, locale: 'zh-CN' },
  tl: { label: 'Tagalog', dict: tl, rtl: false, locale: 'fil' },
  th: { label: 'ไทย', dict: th, rtl: false, locale: 'th' },
} as const satisfies Record<string, LangInfo>;

export type Lang = keyof typeof LANGUAGES;
export type LangSetting = Lang | 'system';

/** Bahasa perangkat bila didukung; selain itu Inggris. */
export function systemLang(): Lang {
  try {
    for (const l of getLocales()) {
      const code = (l.languageCode ?? '').toLowerCase();
      if (code === 'in') return 'id'; // kode lama Android untuk Indonesia
      if (code in LANGUAGES) return code as Lang;
    }
  } catch {
    // modul native tak tersedia (mis. tes) → default
  }
  return 'en';
}

export const resolveLang = (s: LangSetting | undefined): Lang => (!s || s === 'system' ? systemLang() : s);

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends readonly string[] ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Leaves<Dict>;

function lookup(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict);
}

export function translate(lang: Lang, key: TKey, params?: Record<string, string | number>): string {
  const raw = lookup(LANGUAGES[lang].dict, key) ?? lookup(en, key) ?? key;
  const s = Array.isArray(raw) ? raw.join(',') : String(raw);
  return params ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`)) : s;
}

export function translateList(lang: Lang, key: TKey): string[] {
  const raw = lookup(LANGUAGES[lang].dict, key) ?? lookup(en, key);
  return Array.isArray(raw) ? (raw as string[]) : [];
}

export const isRtl = (lang: Lang) => LANGUAGES[lang].rtl || I18nManager.isRTL;
