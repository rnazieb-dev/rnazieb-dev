import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { IslamicGlyph } from '@/components/icons/islamic';
import { Button, Card, Screen, Text } from '@/components/ui';
import { angleDelta, distanceToKaabaKm, qiblaBearing } from '@/features/salat/logic';
import { useSaveLocation } from '@/features/salat/useLocation';
import { useT } from '@/i18n/useT';
import { useTheme } from '@/lib/theme';
import { useApp } from '@/state/app';

const SIZE = 300;

export default function Kiblat() {
  const th = useTheme();
  const { t } = useT();
  const { settings } = useApp();
  const { request, state } = useSaveLocation();
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number>(3);
  const [noSensor, setNoSensor] = useState(false);
  const [rot] = useState(() => new Animated.Value(0));
  const last = useRef(0);
  const wasFacing = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    (async () => {
      try {
        const p = await Location.requestForegroundPermissionsAsync();
        if (p.status !== 'granted') return;
        sub = await Location.watchHeadingAsync((h) => {
          if (!alive) return;
          const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setHeading(v);
          setAccuracy(h.accuracy);
        });
      } catch {
        setNoSensor(true);
      }
    })();
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);

  const bearing = settings.coords ? qiblaBearing(settings.coords) : null;

  useEffect(() => {
    if (heading == null) return;
    // Putar piringan ke -heading dengan jalur terpendek agar tidak "berputar balik" di 0/360.
    const target = last.current + angleDelta(-heading, last.current);
    last.current = target;
    Animated.timing(rot, { toValue: target, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [heading, rot]);

  const delta = heading != null && bearing != null ? angleDelta(bearing, heading) : null;
  const facing = delta != null && Math.abs(delta) <= 4;
  useEffect(() => {
    if (facing && !wasFacing.current) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    wasFacing.current = facing;
  }, [facing]);

  if (!settings.coords || bearing == null) {
    return (
      <Screen>
        <Text variant="title">{t('qibla.title')}</Text>
        <Card>
          <Text>{t('salat.noLocation')}</Text>
          <Button title={state === 'busy' ? t('salat.locating') : t('salat.useLocation')} onPress={request} loading={state === 'busy'} />
          {state === 'denied' ? <Text variant="small" muted>{t('salat.denied')}</Text> : null}
        </Card>
      </Screen>
    );
  }

  const spin = rot.interpolate({ inputRange: [-36000, 36000], outputRange: ['-36000deg', '36000deg'] });
  const r = SIZE / 2;
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const kx = r + Math.sin((bearing * Math.PI) / 180) * (r - 34);
  const ky = r - Math.cos((bearing * Math.PI) / 180) * (r - 34);

  return (
    <Screen>
      <Text variant="title">{t('qibla.title')}</Text>
      <Text variant="heading" color={facing ? th.primary : th.text} style={{ textAlign: 'center' }}>
        {delta == null ? t('qibla.bearing', { deg: Math.round(bearing) }) : facing ? t('qibla.facing') : t('qibla.turn', { dir: delta > 0 ? t('qibla.right') : t('qibla.left'), deg: Math.abs(Math.round(delta)) })}
      </Text>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: SIZE + 40 }}>
        {/* penanda arah ponsel (tetap) */}
        <Svg width={24} height={30} style={{ position: 'absolute', top: 0, zIndex: 2 }}>
          <Path d="M12 0l10 22H2z" fill={facing ? th.primary : th.accent} />
        </Svg>
        <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ rotate: spin }] }}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={r} cy={r} r={r - 2} fill={th.surface} stroke={facing ? th.primary : th.border} strokeWidth={facing ? 4 : 2} />
            {ticks.map((d) => {
              const long = d % 30 === 0;
              const a = (d * Math.PI) / 180;
              return (
                <Line key={d} x1={r + Math.sin(a) * (r - 8)} y1={r - Math.cos(a) * (r - 8)} x2={r + Math.sin(a) * (r - (long ? 22 : 14))} y2={r - Math.cos(a) * (r - (long ? 22 : 14))} stroke={d === 0 ? th.danger : th.muted} strokeWidth={long ? 2 : 1} />
              );
            })}
            {(['N', 'E', 'S', 'W'] as const).map((l, i) => {
              const a = (i * 90 * Math.PI) / 180;
              return (
                <SvgText key={l} x={r + Math.sin(a) * (r - 40)} y={r - Math.cos(a) * (r - 40) + 6} fill={l === 'N' ? th.danger : th.text} fontSize={18} fontWeight="700" textAnchor="middle">{l}</SvgText>
              );
            })}
            <Line x1={r} y1={r} x2={kx} y2={ky} stroke={th.primary} strokeWidth={4} strokeLinecap="round" />
            <G x={kx - 18} y={ky - 18}>
              <Circle cx={18} cy={18} r={20} fill={th.primary} />
            </G>
            <Circle cx={r} cy={r} r={8} fill={th.primary} />
          </Svg>
          <View style={{ position: 'absolute', left: kx - 14, top: ky - 14 }}>
            <IslamicGlyph name="kabah" size={28} />
          </View>
        </Animated.View>
      </View>
      <Card>
        <Text>{t('qibla.bearing', { deg: Math.round(bearing) })}</Text>
        <Text muted>{t('qibla.distance', { km: Math.round(distanceToKaabaKm(settings.coords)).toLocaleString() })}</Text>
        {noSensor ? <Text variant="small" muted>{t('qibla.noSensor')}</Text> : accuracy < 2 ? <Text variant="small" color={th.accent}>{t('qibla.calibrate')}</Text> : null}
      </Card>
    </Screen>
  );
}
