import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { enableAppSwitcherProtectionAsync } from 'expo-screen-capture';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountGate } from '@/components/AccountGate';
import { LockGate } from '@/components/LockGate';
import { AppProvider } from '@/state/app';
import { useTheme } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

function Shell() {
  const t = useTheme();
  const router = useRouter();
  useEffect(() => {
    // Buram pada pratinjau app switcher (iOS) agar isi jurnal tak terlihat.
    void enableAppSwitcherProtectionAsync(50).catch(() => undefined);
    // Ketuk notifikasi pengingat → buka kutipannya.
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const id = resp.notification.request.content.data?.quoteId;
      if (typeof id === 'string') router.push({ pathname: '/quote/[id]', params: { id } });
    });
    return () => sub.remove();
  }, [router]);
  return (
    <LockGate>
      <AccountGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: t.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="deed/new" options={{ title: 'Catat amal', presentation: 'modal' }} />
        <Stack.Screen name="reflection" options={{ title: 'Refleksi' }} />
        <Stack.Screen name="bekal" options={{ title: 'Bekal hari ini' }} />
        <Stack.Screen name="vault" options={{ title: 'Amalan rahasia' }} />
        <Stack.Screen name="auth" options={{ title: 'Akun & cloud', presentation: 'modal' }} />
        <Stack.Screen name="mission/[id]" options={{ title: 'Misi' }} />
        <Stack.Screen name="quote/[id]" options={{ title: 'Kutipan' }} />
        <Stack.Screen name="circle/new" options={{ title: 'Lingkaran baru', presentation: 'modal' }} />
        <Stack.Screen name="circle/join" options={{ title: 'Gabung lingkaran', presentation: 'modal' }} />
        <Stack.Screen name="circle/[id]" options={{ title: 'Lingkaran' }} />
        <Stack.Screen name="settings/reminders" options={{ title: 'Pengingat' }} />
        <Stack.Screen name="settings/security" options={{ title: 'Keamanan & data' }} />
        <Stack.Screen name="settings/about" options={{ title: 'Tentang & sumber' }} />
      </Stack>
      <StatusBar style="auto" />
      </AccountGate>
    </LockGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Amiri_400Regular });
  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
