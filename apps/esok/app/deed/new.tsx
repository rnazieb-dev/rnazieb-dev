import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chip, Field, Row, Screen, Text, Toggle } from '@/components/ui';
import { ScreenGuard } from '@/components/ScreenGuard';
import { VisibilityPicker, type VisibilityValue } from '@/components/VisibilityPicker';
import type { MissionCategory } from '@/content/types';
import { addDeed } from '@/db/repos';
import { checkText } from '@/features/circles/moderation';
import { createPost } from '@/features/circles/api';
import { CUSTOM_DEED_POINTS } from '@/features/gamification/points';
import { useT } from '@/i18n/useT';
import { CATEGORIES } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';

export default function NewDeed() {
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ day?: string }>();
  const { db, today, unlockVault, bump, syncNow, session } = useApp();
  const day = params.day ?? today;
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<MissionCategory>('sedekah');
  const [vis, setVis] = useState<VisibilityValue>({ visibility: 'secret', circleId: null });
  const [post, setPost] = useState(true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const c = checkText(title, 120);
    if (!c.ok) return Alert.alert(t('journal.deed.titleCheck'), c.reason);
    if (vis.visibility !== 'secret') {
      const n = checkText(`${title} ${note}`, 700);
      if (!n.ok) return Alert.alert(t('journal.deed.textCheck'), n.reason);
    }
    setBusy(true);
    try {
      let dek: Uint8Array | null = null;
      if (vis.visibility === 'secret') {
        dek = await unlockVault();
        if (!dek) return Alert.alert(t('journal.common.locked'), t('journal.deed.secretNeedsAuth'));
      }
      const id = await addDeed(db, dek, {
        day,
        title: title.trim(),
        note: note.trim(),
        category,
        visibility: vis.visibility,
        circleId: vis.circleId,
        points: CUSTOM_DEED_POINTS,
      });
      bump();
      if (vis.visibility === 'circle' && post && vis.circleId && session) {
        await syncNow();
        const sb = getSupabase();
        if (sb) await createPost(sb, vis.circleId, '', id).catch(() => undefined);
      } else if (vis.visibility !== 'secret') {
        void syncNow();
      }
      router.back();
    } catch (e) {
      Alert.alert(t('journal.common.saveFailed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenGuard active={vis.visibility === 'secret'} id="deed-new" />
      <Field label={t('journal.deed.whatLabel')} value={title} onChangeText={setTitle} placeholder={t('journal.deed.whatPlaceholder')} maxLength={120} />
      <Field label={t('journal.deed.noteLabel')} value={note} onChangeText={setNote} multiline maxLength={500} hint={vis.visibility === 'secret' ? undefined : t('journal.deed.noteHint')} />
      <Text variant="label">{t('journal.deed.category')}</Text>
      <Row>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={t(`journal.categories.${c}`)} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </Row>
      <VisibilityPicker value={vis} onChange={setVis} />
      {vis.visibility === 'circle' ? <Toggle label={t('journal.deed.postToFeed')} value={post} onValueChange={setPost} /> : null}
      <Button title={t('journal.common.save')} onPress={save} loading={busy} disabled={!title.trim() || (vis.visibility === 'circle' && !vis.circleId)} />
    </Screen>
  );
}
