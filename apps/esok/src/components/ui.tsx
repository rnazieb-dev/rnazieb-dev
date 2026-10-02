import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Switch,
  Text as RNText,
  type TextProps,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '@/lib/theme';

type Variant = 'title' | 'heading' | 'body' | 'small' | 'label';

const sizes: Record<Variant, { fontSize: number; fontWeight: '400' | '600' | '700'; lineHeight: number }> = {
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  heading: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 23 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
};

export function Text({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const t = useTheme();
  return <RNText {...rest} style={[sizes[variant], { color: color ?? (muted ? t.muted : t.text) }, style]} />;
}

/** Teks Arab: font Amiri, RTL, ukuran besar agar harakat terbaca. */
export function Arabic({ children, size = 26 }: { children: string; size?: number }) {
  const t = useTheme();
  return (
    <RNText
      accessibilityLanguage="ar"
      style={{ fontFamily: 'Amiri_400Regular', fontSize: size, lineHeight: size * 1.9, color: t.text, textAlign: 'right', writingDirection: 'rtl' }}
    >
      {children}
    </RNText>
  );
}

export function Screen({ children, scroll = true, padded = true }: { children: ReactNode; scroll?: boolean; padded?: boolean }) {
  const t = useTheme();
  const inner = padded ? { padding: space.lg, gap: space.lg } : undefined;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, { paddingBottom: space.xxl * 2 }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style, tone }: { children: ReactNode; style?: ViewStyle; tone?: 'secret' | 'accent' }) {
  const t = useTheme();
  const border = tone === 'secret' ? t.secret : tone === 'accent' ? t.accent : t.border;
  return (
    <View
      style={[
        { backgroundColor: t.surface, borderRadius: radius.lg, borderWidth: tone ? 1.5 : StyleSheet.hairlineWidth, borderColor: border, padding: space.lg, gap: space.sm },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  ...rest
}: Omit<PressableProps, 'children'> & { title: string; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.primary : variant === 'danger' ? t.danger : variant === 'secondary' ? t.surfaceAlt : 'transparent';
  const fg = variant === 'primary' ? t.onPrimary : variant === 'danger' ? '#fff' : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: radius.pill,
        paddingVertical: 13,
        paddingHorizontal: space.xl,
        alignItems: 'center',
        minHeight: 48,
        justifyContent: 'center',
      })}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : <RNText style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</RNText>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone }: { label: string; selected?: boolean; onPress?: () => void; tone?: 'secret' }) {
  const t = useTheme();
  const active = tone === 'secret' ? t.secret : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? active : t.border,
        backgroundColor: selected ? active : t.surface,
        minHeight: 40,
        justifyContent: 'center',
      }}
    >
      <RNText style={{ color: selected ? t.onPrimary : t.text, fontWeight: '600', fontSize: 14 }}>{label}</RNText>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Field({ label, hint, ...rest }: TextInputProps & { label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        {...rest}
        style={[
          {
            backgroundColor: t.surface,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: t.text,
            fontSize: 16,
            minHeight: 48,
          },
          rest.multiline ? { minHeight: 96, textAlignVertical: 'top' } : null,
          rest.style,
        ]}
      />
      {hint ? <Text variant="small" muted>{hint}</Text> : null}
    </View>
  );
}

export function Toggle({ label, value, onValueChange, hint }: { label: string; value: boolean; onValueChange: (v: boolean) => void; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <Text>{label}</Text>
        {hint ? <Text variant="small" muted>{hint}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ true: t.primary, false: t.border }} />
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(1, Math.max(0, value)) * 100) }}
      style={{ height: 10, borderRadius: radius.pill, backgroundColor: t.surfaceAlt, overflow: 'hidden' }}
    >
      <View style={{ width: `${Math.min(1, Math.max(0, value)) * 100}%`, height: '100%', backgroundColor: color ?? t.primary }} />
    </View>
  );
}

export function Pill({ label, tone }: { label: string; tone?: 'secret' | 'accent' | 'muted' }) {
  const t = useTheme();
  const c = tone === 'secret' ? t.secret : tone === 'accent' ? t.accent : t.muted;
  return (
    <View style={{ borderColor: c, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 }}>
      <RNText style={{ color: c, fontSize: 12, fontWeight: '600' }}>{label}</RNText>
    </View>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <View style={{ alignItems: 'center', padding: space.xl, gap: space.xs }}>
      <Text variant="heading">{title}</Text>
      {body ? <Text muted style={{ textAlign: 'center' }}>{body}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text variant="heading" style={{ marginTop: space.sm }}>{children}</Text>;
}
