import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';
import { type Circle, listMyCircles, myPendingCount } from './api';

export function useCircles() {
  const { session, settings } = useApp();
  const [circles, setCircles] = useState<{ circle: Circle; role: string }[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = !!session && settings.cloudEnabled && settings.onboarded && !settings.isMinor;

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !session || !enabled) return;
    setLoading(true);
    try {
      const rows = await listMyCircles(sb, session.user.id);
      setCircles(rows.map((r) => ({ circle: r.circle, role: r.role })));
      setPending(await myPendingCount(sb, session.user.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat grup');
    } finally {
      setLoading(false);
    }
  }, [session, enabled]);

  useEffect(() => {
    // Pengambilan data awal/ulang saat sesi berubah.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { circles, pending, loading, error, refresh, enabled };
}
