import { Tabs } from 'expo-router';
import { House, type LucideIcon, NotebookPen, Target, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg from 'react-native-svg';
import { ISLAMIC_GLYPHS } from '@/components/icons/islamic';
import { useT } from '@/i18n/useT';
import { useTheme } from '@/lib/theme';

/** Ikon tab yang "melompat" kecil saat aktif, dengan pil latar lembut. */
function TabIcon({ focused, color: c, Icon, glyph }: { focused: boolean; color: unknown; Icon?: LucideIcon; glyph?: keyof typeof ISLAMIC_GLYPHS }) {
  const t = useTheme();
  const [v] = useState(() => new Animated.Value(focused ? 1 : 0));
  useEffect(() => {
    Animated.spring(v, { toValue: focused ? 1 : 0, friction: 5, tension: 180, useNativeDriver: true }).start();
  }, [focused, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const Draw = glyph ? ISLAMIC_GLYPHS[glyph] : null;
  const color = String(c);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 52, height: 30, borderRadius: 15, backgroundColor: t.primary, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }) }} />
      <Animated.View style={{ transform: [{ scale }, { translateY: y }] }}>
        {Icon ? (
          <Icon size={23} color={color} strokeWidth={focused ? 2.4 : 2} />
        ) : Draw ? (
          <Svg width={25} height={25} viewBox="0 0 48 48">
            <Draw size={25} color={color} accent={focused ? t.accent : color} />
          </Svg>
        ) : null}
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const th = useTheme();
  const { t } = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: th.primary,
        tabBarInactiveTintColor: th.muted,
        tabBarStyle: { backgroundColor: th.surface, borderTopColor: th.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: (p) => <TabIcon {...p} Icon={House} /> }} />
      <Tabs.Screen name="jurnal" options={{ title: t('tabs.journal'), tabBarIcon: (p) => <TabIcon {...p} Icon={NotebookPen} /> }} />
      <Tabs.Screen name="ibadah" options={{ title: t('tabs.worship'), tabBarIcon: (p) => <TabIcon {...p} glyph="masjid" /> }} />
      <Tabs.Screen name="misi" options={{ title: t('tabs.missions'), tabBarIcon: (p) => <TabIcon {...p} Icon={Target} /> }} />
      <Tabs.Screen name="profil" options={{ title: t('tabs.profile'), tabBarIcon: (p) => <TabIcon {...p} Icon={UserRound} /> }} />
      <Tabs.Screen name="grup" options={{ href: null, title: t('tabs.groups') }} />
    </Tabs>
  );
}
