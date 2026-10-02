import { useCallback, useMemo } from 'react';
import { setDateLocale } from '@/lib/dates';
import { useApp } from '@/state/app';
import { type Lang, type TKey, resolveLang, translate, translateList } from './index';

export function useLang(): Lang {
  const { settings } = useApp();
  const lang = useMemo(() => resolveLang(settings.language), [settings.language]);
  setDateLocale(lang);
  return lang;
}

export function useT() {
  const lang = useLang();
  const t = useCallback((key: TKey, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
  const tl = useCallback((key: TKey) => translateList(lang, key), [lang]);
  return { t, tl, lang };
}
