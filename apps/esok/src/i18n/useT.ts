import { useCallback, useMemo } from 'react';
import { useApp } from '@/state/app';
import { type Lang, type TKey, resolveLang, translate, translateList } from './index';

export function useLang(): Lang {
  const { settings } = useApp();
  return useMemo(() => resolveLang(settings.language), [settings.language]);
}

export function useT() {
  const lang = useLang();
  const t = useCallback((key: TKey, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
  const tl = useCallback((key: TKey) => translateList(lang, key), [lang]);
  return { t, tl, lang };
}
