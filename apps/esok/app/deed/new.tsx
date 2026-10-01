import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chip, Field, Row, Screen, Text, Toggle } from '@/components/ui';
import { VisibilityPicker, type VisibilityValue } from '@/components/VisibilityPicker';
import type { MissionCategory } from '@/content/types';
import { addDeed } from '@/db/repos';
import { checkText } from '@/features/circles/moderation';
import { createPost } from '@/features/circles/api';
import { CUSTOM_DEED_POINTS } from '@/features/gamification/points';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase';
import { useApp } from '@/state/app';

export default function NewDeed() {
  const router = useRouter();
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
    if (!c.ok) return Alert.alert('Judul', c.reason);
    if (vis.visibility !== 'secret') {
      const n = checkText(`${title} ${note}`, 700);
      if (!n.ok) return Alert.alert('Teks', n.reason);
    }
    setBusy(true);
    try {
      let dek: Uint8Array | null = null;
      if (vis.visibility === 'secret') {
        dek = await unlockVault();
        if (!dek) return Alert.alert('Terkunci', 'Amalan rahasia butuh verifikasi perangkat.');
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
      Alert.alert('Gagal menyimpan', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Field label="Apa kebaikan yang Anda lakukan?" value={title} onChangeText={setTitle} placeholder="mis. Menelepon ibu" maxLength={120} />
      <Field label="Catatan (opsional)" value={note} onChangeText={setNote} multiline maxLength={500} hint={vis.visibility === 'secret' ? undefined : 'Jangan menyebut identitas orang yang dibantu; jaga martabat mereka.'} />
      <Text variant="label">Kategori</Text>
      <Row>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </Row>
      <VisibilityPicker value={vis} onChange={setVis} />
      {vis.visibility === 'circle' ? <Toggle label="Posting ke feed lingkaran" value={post} onValueChange={setPost} /> : null}
      <Button title="Simpan" onPress={save} loading={busy} disabled={!title.trim() || (vis.visibility === 'circle' && !vis.circleId)} />
    </Screen>
  );
}
