import { Amiri_400Regular } from '@expo-google-fonts/amiri/400Regular';
import { useFonts } from 'expo-font';
import { Notifications } from '@/lib/notifications';
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
import { useT } from '@/i18n/useT';
import { RtlSync } from '@/i18n/RtlSync';

void SplashScreen.preventAutoHideAsync();

function Shell() {
  const th = useTheme();
  const { t } = useT();
  const router = useRouter();
  useEffect(() => {
    // Buram pada pratinjau app switcher (iOS) agar isi jurnal tak terlihat.
    void enableAppSwitcherProtectionAsync(50).catch(() => undefined);
    // Ketuk notifikasi pengingat → buka kutipannya.
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data;
      if (data?.route === 'adhkar') router.push({ pathname: '/adhkar', params: { tab: String(data.tab ?? '') } });
      else if (data?.route === 'ledger') router.push('/ledger');
      else if (data?.route === 'salat') router.push('/salat');
      else if (typeof data?.quoteId === 'string') router.push({ pathname: '/quote/[id]', params: { id: data.quoteId } });
    });
    return () => sub.remove();
  }, [router]);
  return (
    <LockGate>
      <RtlSync />
      <AccountGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: th.bg },
          headerTintColor: th.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: th.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="deed/new" options={{ title: 'Catat amal', presentation: 'modal' }} />
        <Stack.Screen name="reflection" options={{ title: 'Refleksi' }} />
        <Stack.Screen name="bekal" options={{ title: 'Bekal hari ini' }} />
        <Stack.Screen name="adhkar" options={{ title: 'Dzikir & doa' }} />
        <Stack.Screen name="ledger/index" options={{ title: 'Utang, amanah & wasiat' }} />
        <Stack.Screen name="ledger/[id]" options={{ title: 'Catatan', presentation: 'modal' }} />
        <Stack.Screen name="vault" options={{ title: 'Amalan rahasia' }} />
        <Stack.Screen name="auth" options={{ title: 'Akun & cloud', presentation: 'modal' }} />
        <Stack.Screen name="mission/[id]" options={{ title: 'Misi' }} />
        <Stack.Screen name="quote/[id]" options={{ title: 'Kutipan' }} />
        <Stack.Screen name="circle/new" options={{ title: 'Grup baru', presentation: 'modal' }} />
        <Stack.Screen name="circle/join" options={{ title: 'Gabung grup', presentation: 'modal' }} />
        <Stack.Screen name="circle/[id]" options={{ title: 'Grup' }} />
        <Stack.Screen name="settings/reminders" options={{ title: 'Pengingat' }} />
        <Stack.Screen name="settings/security" options={{ title: 'Keamanan & data' }} />
        <Stack.Screen name="settings/about" options={{ title: 'Tentang & sumber' }} />
        <Stack.Screen name="salat" options={{ headerShown: false }} />
        <Stack.Screen name="kiblat" options={{ title: t('qibla.title') }} />
        <Stack.Screen name="tasbih" options={{ title: t('tasbih.title') }} />
        <Stack.Screen name="kalender" options={{ title: t('calendar.title') }} />
        <Stack.Screen name="dzikir" options={{ title: t('dhikr.title') }} />
        <Stack.Screen name="quran/index" options={{ title: t('quran.title') }} />
        <Stack.Screen name="quran/[surah]" options={{ title: t('quran.title') }} />
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
