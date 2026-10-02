import { View } from 'react-native';
import { useCircles } from '@/features/circles/useCircles';
import type { Visibility } from '@/db/repos';
import { useT } from '@/i18n/useT';
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
  const { t } = useT();
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="label">{t('journal.visibility.question')}</Text>
      <Row>
        {allowSecret ? <Chip label={t('journal.visibility.secretLocked')} tone="secret" selected={value.visibility === 'secret'} onPress={() => onChange({ visibility: 'secret', circleId: null })} /> : null}
        {enabled ? (
          <>
            <Chip label={t('journal.visibility.circle')} selected={value.visibility === 'circle'} onPress={() => onChange({ visibility: 'circle', circleId: value.circleId ?? circles[0]?.circle.id ?? null })} />
            <Chip label={t('journal.visibility.public')} selected={value.visibility === 'public'} onPress={() => onChange({ visibility: 'public', circleId: null })} />
          </>
        ) : null}
      </Row>
      {value.visibility === 'secret' ? (
        <Text variant="small" muted>{t('journal.visibility.secretHint')}</Text>
      ) : (
        <Text variant="small" muted>{t('journal.visibility.shareHint')}</Text>
      )}
      {!enabled ? <Text variant="small" muted>{t('journal.visibility.cloudOff')}</Text> : null}
      {value.visibility === 'circle' ? (
        circles.length ? (
          <Row>
            {circles.map((c) => (
              <Chip key={c.circle.id} label={c.circle.name} selected={value.circleId === c.circle.id} onPress={() => onChange({ visibility: 'circle', circleId: c.circle.id })} />
            ))}
          </Row>
        ) : (
          <Text variant="small" muted>{t('journal.visibility.noCircles')}</Text>
        )
      ) : null}
    </View>
  );
}
