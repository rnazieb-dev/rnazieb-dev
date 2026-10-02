import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Chip, Empty, Field, Pill, Row, Text } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { CATEGORY_LABEL } from '@/lib/labels';
import { getSupabase } from '@/lib/supabase';
import { addComment, blockUser, createPost, deleteComment, deletePost, hidePost, loadFeed, report, toggleReaction, type Circle } from '../api';
import { REACTIONS } from '../moderation';
import { useAsync } from './useAsync';

export function FeedSection({ circle, uid, isAdmin }: { circle: Circle; uid: string; isAdmin: boolean }) {
  const sb = getSupabase()!;
  const { t } = useT();
  const feed = useAsync(() => loadFeed(sb, circle.id, uid), [circle.id, uid], []);
  const [text, setText] = useState('');
  const [comment, setComment] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      feed.reload();
    } catch (e) {
      Alert.alert(t('groups.failed'), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const askReport = (type: 'post' | 'comment' | 'user', id: string) =>
    Alert.alert(t('groups.feed.reportTitle'), t('groups.feed.reportPrompt'), [
      { text: t('groups.feed.reasonAbuse'), onPress: () => act(() => report(sb, type, id, 'Tidak santun / perundungan')) },
      { text: t('groups.feed.reasonSpam'), onPress: () => act(() => report(sb, type, id, 'Spam atau tautan')) },
      { text: t('groups.feed.reasonShowOff'), onPress: () => act(() => report(sb, type, id, 'Pamer berlebihan')) },
      { text: t('groups.cancel'), style: 'cancel' },
    ]);

  return (
    <>
      <Card>
        <Field label={t('groups.feed.composeLabel')} value={text} onChangeText={setText} multiline maxLength={280} hint={t('groups.feed.composeHint')} />
        <Button title={t('groups.send')} onPress={() => act(async () => { await createPost(sb, circle.id, text); setText(''); })} loading={busy} disabled={!text.trim()} />
      </Card>
      {feed.error ? <Text color="#B3402F">{feed.error}</Text> : null}
      {!feed.loading && feed.data.length === 0 ? <Empty title={t('groups.feed.emptyTitle')} body={t('groups.feed.emptyBody')} /> : null}
      {feed.data.map((p) => (
        <Card key={p.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="heading">{p.author}</Text>
            <Text variant="small" muted>{p.created_at.slice(0, 10)}</Text>
          </Row>
          {p.deed ? (
            <Card tone="accent">
              <Pill label={CATEGORY_LABEL[p.deed.category]} tone="muted" />
              <Text variant="heading">{p.deed.title}</Text>
            </Card>
          ) : null}
          {p.body ? <Text>{p.body}</Text> : null}
          <Row>
            {REACTIONS.map((r) => {
              const on = p.mine.includes(r.kind);
              return <Chip key={r.kind} label={`${t(`groups.reactions.${r.kind}`)}${p.reactions[r.kind] ? ` · ${p.reactions[r.kind]}` : ''}`} selected={on} onPress={() => act(() => toggleReaction(sb, p.id, r.kind, uid, !on))} />;
            })}
          </Row>
          {p.comments.map((c) => (
            <Row key={c.id} style={{ justifyContent: 'space-between' }}>
              <Text style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{c.author}: </Text>{c.body}</Text>
              {c.user_id === uid || isAdmin ? <Text variant="small" muted onPress={() => act(() => deleteComment(sb, c.id))}>{t('groups.remove')}</Text> : <Text variant="small" muted onPress={() => askReport('comment', c.id)}>{t('groups.report')}</Text>}
            </Row>
          ))}
          {circle.comments_enabled ? (
            <Row>
              <Field label={t('groups.feed.comment')} value={comment[p.id] ?? ''} onChangeText={(v) => setComment({ ...comment, [p.id]: v })} maxLength={200} />
              <Button title={t('groups.send')} variant="secondary" disabled={!(comment[p.id] ?? '').trim()} onPress={() => act(async () => { await addComment(sb, p.id, comment[p.id] ?? ''); setComment({ ...comment, [p.id]: '' }); })} />
            </Row>
          ) : <Text variant="small" muted>{t('groups.feed.commentsDisabled')}</Text>}
          <Row>
            {p.user_id === uid || isAdmin ? <Button title={t('groups.remove')} variant="ghost" onPress={() => act(() => deletePost(sb, p.id))} /> : null}
            {isAdmin && p.user_id !== uid ? <Button title={t('groups.feed.hide')} variant="ghost" onPress={() => act(() => hidePost(sb, p.id, true))} /> : null}
            {p.user_id !== uid ? <Button title={t('groups.report')} variant="ghost" onPress={() => askReport('post', p.id)} /> : null}
            {p.user_id !== uid ? <Button title={t('groups.block')} variant="ghost" onPress={() => Alert.alert(t('groups.feed.blockTitle'), t('groups.feed.blockBody'), [{ text: t('groups.cancel'), style: 'cancel' }, { text: t('groups.block'), style: 'destructive', onPress: () => act(() => blockUser(sb, p.user_id)) }])} /> : null}
          </Row>
        </Card>
      ))}
    </>
  );
}
