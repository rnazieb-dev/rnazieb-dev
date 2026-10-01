import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect } from 'react';

/** Blokir tangkapan layar/rekam layar selama `active` (mis. saat isi rahasia ditampilkan). */
export function ScreenGuard({ active, id }: { active: boolean; id: string }) {
  useEffect(() => {
    if (!active) return;
    void preventScreenCaptureAsync(id).catch(() => undefined);
    return () => {
      void allowScreenCaptureAsync(id).catch(() => undefined);
    };
  }, [active, id]);
  return null;
}
