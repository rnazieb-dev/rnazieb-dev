import { getLocales } from 'expo-localization';
import { useMemo } from 'react';
import { useApp } from '@/state/app';
import { useLang } from '@/i18n/useT';
import { defaultCurrency } from './money';

/** Wilayah perangkat (ISO alpha-2) atau null. */
export function deviceRegion(): string | null {
  try {
    return getLocales()[0]?.regionCode ?? null;
  } catch {
    return null;
  }
}

function deviceCurrencyCode(): string | null {
  try {
    return getLocales()[0]?.currencyCode ?? null;
  } catch {
    return null;
  }
}

/** Mata uang yang dipakai untuk catatan: pilihan pengguna, atau bawaan dari perangkat. */
export function useCurrency(): { code: string; auto: string; setting: string } {
  const { settings } = useApp();
  const lang = useLang();
  return useMemo(() => {
    const auto = defaultCurrency(deviceRegion(), deviceCurrencyCode());
    const setting = settings.currency || 'auto';
    return { code: setting === 'auto' ? auto : setting, auto, setting, lang };
  }, [settings.currency, lang]) as { code: string; auto: string; setting: string };
}
