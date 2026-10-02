import { View } from 'react-native';
import { useCircles } from '@/features/circles/useCircles';
import type { Visibility } from '@/db/repos';
import { space } from '@/lib/theme';
import { Chip, Row, Text } from './ui';

export interface VisibilityValue {
  visibility: Visibility;
  circleId: string | null;
}

/**
 * Pemilih visibilitas. Bawaan SELALU Rahasia. Saat memilih berbagi, pengguna diingatkan memperbarui niat.
 * Grup/Publik hanya tersedia bila cloud aktif (butuh akun).
 */
export function VisibilityPicker({
  value,
  onChange,
  allowSecret = true,
}: {
  value: VisibilityValue;
  onChange: (v: VisibilityValue) => void;
  allowSecret?: boolean;
}) {
  const { circles, enabled } = useCircles();
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="label">Siapa yang boleh melihat?</Text>
      <Row>
        {allowSecret ? <Chip label="🔒 Rahasia" tone="secret" selected={value.visibility === 'secret'} onPress={() => onChange({ visibility: 'secret', circleId: null })} /> : null}
        {enabled ? (
          <>
            <Chip label="Grup" selected={value.visibility === 'circle'} onPress={() => onChange({ visibility: 'circle', circleId: value.circleId ?? circles[0]?.circle.id ?? null })} />
            <Chip label="Semua teman grup" selected={value.visibility === 'public'} onPress={() => onChange({ visibility: 'public', circleId: null })} />
          </>
        ) : null}
      </Row>
      {value.visibility === 'secret' ? (
        <Text variant="small" muted>Terenkripsi di perangkat. Tidak masuk feed, peringkat, atau notifikasi siapa pun.</Text>
      ) : (
        <Text variant="small" muted>Perbarui niat: untuk Allah, bukan pujian. Berbagi boleh untuk saling mengajak; amal paling utama sering yang tersembunyi.</Text>
      )}
      {!enabled ? <Text variant="small" muted>Untuk berbagi ke grup, aktifkan akun & cloud di Profil.</Text> : null}
      {value.visibility === 'circle' ? (
        circles.length ? (
          <Row>
            {circles.map((c) => (
              <Chip key={c.circle.id} label={c.circle.name} selected={value.circleId === c.circle.id} onPress={() => onChange({ visibility: 'circle', circleId: c.circle.id })} />
            ))}
          </Row>
        ) : (
          <Text variant="small" muted>Belum ada grup aktif. Buat atau gabung di tab Grup.</Text>
        )
      ) : null}
    </View>
  );
}
