import { useCallback, useEffect, useState } from 'react';
import { getSetting, setSetting } from '@/db/repos';
import { useApp } from '@/state/app';
import { type QuranState, emptyQuranState } from './data';

export function useQuranState() {
  const { db } = useApp();
  const [state, setState] = useState<QuranState>(emptyQuranState);
  const reload = useCallback(() => {
    void getSetting<QuranState>(db, 'quran', emptyQuranState()).then(setState);
  }, [db]);
  useEffect(reload, [reload]);
  const save = useCallback(
    (next: QuranState) => {
      setState(next);
      void setSetting(db, 'quran', next);
    },
    [db],
  );
  return { state, save, reload };
}
