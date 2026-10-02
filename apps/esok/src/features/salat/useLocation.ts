import * as Location from 'expo-location';
import { useState } from 'react';
import { useApp } from '@/state/app';

/** Minta lokasi kasar (dibulatkan 2 desimal ≈ 1 km) dan simpan ke pengaturan. Tak pernah dikirim ke server. */
export function useSaveLocation() {
  const { updateSettings } = useApp();
  const [state, setState] = useState<'idle' | 'busy' | 'denied' | 'error'>('idle');
  const request = async () => {
    setState('busy');
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== 'granted') return setState('denied');
      const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      const coords = { latitude: Math.round(pos.coords.latitude * 100) / 100, longitude: Math.round(pos.coords.longitude * 100) / 100 };
      let place: string | null = null;
      try {
        const [r] = await Location.reverseGeocodeAsync(coords);
        place = [r?.city ?? r?.subregion, r?.country].filter(Boolean).join(', ') || null;
      } catch {
        place = null;
      }
      await updateSettings({ coords, placeName: place });
      setState('idle');
    } catch {
      setState('error');
    }
  };
  return { request, state };
}
