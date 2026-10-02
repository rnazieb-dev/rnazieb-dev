import { useEffect, useState } from 'react';
import type { useT } from '@/i18n/useT';
import type { PrayerKey } from './logic';

export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function countdownText(t: ReturnType<typeof useT>['t'], ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? t('salat.countdown.hm', { h, m }) : t('salat.countdown.min', { m });
}

export function prayerName(t: ReturnType<typeof useT>['t'], key: PrayerKey, at: Date): string {
  return key === 'zuhur' && at.getDay() === 5 ? t('salat.friday') : t(`salat.names.${key}`);
}

