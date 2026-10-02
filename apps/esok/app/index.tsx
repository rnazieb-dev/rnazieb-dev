import { Redirect } from 'expo-router';

export default function Index() {
  // Langsung ke isi aplikasi; pengenalan & setup ditawarkan lewat banner di Beranda.
  return <Redirect href="/(tabs)" />;
}
