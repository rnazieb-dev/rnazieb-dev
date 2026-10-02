import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import en, { type Dict } from './en';
import id from './id';

export const LANGUAGES = {
  en: { label: 'English', dict: en, rtl: false },
  id: { label: 'Bahasa Indonesia', dict: id, rtl: false },
} as const;

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
