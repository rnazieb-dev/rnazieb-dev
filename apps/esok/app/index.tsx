import { Redirect } from 'expo-router';
import { useApp } from '@/state/app';

export default function Index() {
  const { settings } = useApp();
  return <Redirect href={settings.onboarded ? '/(tabs)' : '/onboarding'} />;
}
