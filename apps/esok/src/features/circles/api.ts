import type { SupabaseClient } from '@supabase/supabase-js';
import type { MissionCategory } from '@/content/types';
import { checkText } from './moderation';

export type CircleKind = 'campur' | 'sesama_jenis' | 'keluarga';

export interface Circle {
  id: string;
  name: string;
  kind: CircleKind;
  invite_code: string;
  created_by: string;
  rankings_enabled: boolean;
  comments_enabled: boolean;
}
export interface Member {
  user_id: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active';
  display_name: string;
}
export interface FeedItem {
  id: string;
  user_id: string;
  author: string;
  body: string;
  created_at: string;
  deed?: { title: string; category: MissionCategory; day: string } | null;
  reactions: Record<string, number>;
  mine: string[];
  comments: { id: string; user_id: string; author: string; body: string; created_at: string }[];
}
export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: string;
  starts_on: string;
  ends_on: string;
  total: number;
  contributors: number;
}
export interface RankRow {
  user_id: string;
  display_name: string;
  points: number;
}

function ok<T>(r: { data: T | null; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data as T;
}

const clientError = (c: { ok: boolean; reason?: string }) => {
  if (!c.ok) throw new Error(c.reason);
};

export async function listMyCircles(sb: SupabaseClient, uid: string): Promise<{ circle: Circle; status: 'pending' | 'active'; role: string }[]> {
  const mem = ok(await sb.from('circle_members').select('circle_id, role, status').eq('user_id', uid), 'Memuat keanggotaan');
  const active = (mem as { circle_id: string; role: string; status: 'pending' | 'active' }[]).filter((m) => m.status === 'active');
  const ids = active.map((m) => m.circle_id);
  const circles = ids.length ? ((ok(await sb.from('circles').select('*').in('id', ids), 'Memuat lingkaran') as Circle[]) ?? []) : [];
  const pending = (mem as { status: string }[]).filter((m) => m.status === 'pending').length;
  const rows = circles.map((c) => {
    const m = active.find((x) => x.circle_id === c.id)!;
    return { circle: c, status: m.status, role: m.role };
  });
  // Permintaan yang menunggu: ditampilkan sebagai ringkasan oleh UI via listMyPendingCount.
  void pending;
  return rows;
}

export async function myPendingCount(sb: SupabaseClient, uid: string): Promise<number> {
  const r = await sb.from('circle_members').select('circle_id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'pending');
  return r.count ?? 0;
}

export async function createCircle(sb: SupabaseClient, name: string, kind: CircleKind): Promise<string> {
  clientError(checkText(name, 60));
  return ok(await sb.rpc('create_circle', { p_name: name, p_kind: kind }), 'Membuat lingkaran') as string;
}

export async function joinCircle(sb: SupabaseClient, code: string): Promise<void> {
  const r = await sb.rpc('join_circle', { p_code: code });
  if (r.error) throw new Error(r.error.message.includes('kode tidak valid') ? 'Kode tidak valid.' : r.error.message);
}

export async function listMembers(sb: SupabaseClient, circleId: string): Promise<Member[]> {
  const rows = ok(await sb.from('circle_members').select('user_id, role, status').eq('circle_id', circleId), 'Memuat anggota') as Omit<Member, 'display_name'>[];
  const names = await profileNames(sb, rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, display_name: names.get(r.user_id) ?? 'Anggota' }));
}

async function profileNames(sb: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const rows = ok(await sb.from('profiles').select('id, display_name').in('id', ids), 'Memuat profil') as { id: string; display_name: string }[];
  for (const r of rows) map.set(r.id, r.display_name);
  return map;
}

export const approveMember = async (sb: SupabaseClient, circleId: string, userId: string) =>
  ok(await sb.from('circle_members').update({ status: 'active' }).eq('circle_id', circleId).eq('user_id', userId), 'Menyetujui');
export const removeMember = async (sb: SupabaseClient, circleId: string, userId: string) =>
  ok(await sb.from('circle_members').delete().eq('circle_id', circleId).eq('user_id', userId), 'Mengeluarkan');

export async function updateCircleSettings(sb: SupabaseClient, circleId: string, patch: Partial<Pick<Circle, 'rankings_enabled' | 'comments_enabled' | 'name'>>) {
  if (patch.name !== undefined) clientError(checkText(patch.name, 60));
  ok(await sb.from('circles').update(patch).eq('id', circleId), 'Menyimpan pengaturan');
}

export async function loadFeed(sb: SupabaseClient, circleId: string, uid: string, limit = 30): Promise<FeedItem[]> {
  const posts = ok(
    await sb.from('feed_posts').select('id, user_id, body, created_at, deed_id').eq('circle_id', circleId).order('created_at', { ascending: false }).limit(limit),
    'Memuat feed',
  ) as { id: string; user_id: string; body: string; created_at: string; deed_id: string | null }[];
  if (!posts.length) return [];
  const postIds = posts.map((p) => p.id);
  const deedIds = posts.map((p) => p.deed_id).filter((x): x is string => !!x);
  const [reactions, comments, deeds] = await Promise.all([
    sb.from('reactions').select('post_id, user_id, kind').in('post_id', postIds),
    sb.from('comments').select('id, post_id, user_id, body, created_at').in('post_id', postIds).order('created_at'),
    deedIds.length ? sb.from('deeds').select('id, title, category, day').in('id', deedIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const rx = ok(reactions, 'Memuat reaksi') as { post_id: string; user_id: string; kind: string }[];
  const cm = ok(comments, 'Memuat komentar') as { id: string; post_id: string; user_id: string; body: string; created_at: string }[];
  const dd = ok(deeds as never, 'Memuat amal') as { id: string; title: string; category: MissionCategory; day: string }[];
  const names = await profileNames(sb, [...new Set([...posts.map((p) => p.user_id), ...cm.map((c) => c.user_id)])]);
  return posts.map((p) => {
    const counts: Record<string, number> = {};
    const mine: string[] = [];
    for (const r of rx.filter((x) => x.post_id === p.id)) {
      counts[r.kind] = (counts[r.kind] ?? 0) + 1;
      if (r.user_id === uid) mine.push(r.kind);
    }
    const d = dd.find((x) => x.id === p.deed_id);
    return {
      id: p.id,
      user_id: p.user_id,
      author: names.get(p.user_id) ?? 'Anggota',
      body: p.body,
      created_at: p.created_at,
      deed: d ? { title: d.title, category: d.category, day: d.day } : null,
      reactions: counts,
      mine,
      comments: cm.filter((c) => c.post_id === p.id).map((c) => ({ ...c, author: names.get(c.user_id) ?? 'Anggota' })),
    };
  });
}

export async function createPost(sb: SupabaseClient, circleId: string, body: string, deedId?: string) {
  clientError(checkText(body, 280, { allowEmpty: !!deedId }));
  ok(await sb.from('feed_posts').insert({ circle_id: circleId, body: body.trim(), deed_id: deedId ?? null }), 'Memposting');
}

export async function toggleReaction(sb: SupabaseClient, postId: string, kind: string, uid: string, on: boolean) {
  if (on) ok(await sb.from('reactions').insert({ post_id: postId, kind }), 'Bereaksi');
  else ok(await sb.from('reactions').delete().eq('post_id', postId).eq('user_id', uid).eq('kind', kind), 'Membatalkan reaksi');
}

export async function addComment(sb: SupabaseClient, postId: string, body: string) {
  clientError(checkText(body, 200));
  ok(await sb.from('comments').insert({ post_id: postId, body: body.trim() }), 'Berkomentar');
}

export const deletePost = async (sb: SupabaseClient, id: string) => ok(await sb.from('feed_posts').delete().eq('id', id), 'Menghapus');
export const hidePost = async (sb: SupabaseClient, id: string, hidden: boolean) =>
  ok(await sb.from('feed_posts').update({ hidden }).eq('id', id), 'Menyembunyikan');
export const deleteComment = async (sb: SupabaseClient, id: string) => ok(await sb.from('comments').delete().eq('id', id), 'Menghapus');

export async function report(sb: SupabaseClient, targetType: 'post' | 'comment' | 'user' | 'circle', targetId: string, reason: string) {
  clientError(checkText(reason, 300));
  ok(await sb.from('reports').insert({ target_type: targetType, target_id: targetId, reason }), 'Melaporkan');
}
export const blockUser = async (sb: SupabaseClient, userId: string) => ok(await sb.from('blocks').insert({ blocked: userId }), 'Memblokir');
export const unblockUser = async (sb: SupabaseClient, uid: string, userId: string) =>
  ok(await sb.from('blocks').delete().eq('blocker', uid).eq('blocked', userId), 'Membuka blokir');

export async function loadChallenges(sb: SupabaseClient, circleId: string): Promise<Challenge[]> {
  const rows = ok(
    await sb.from('circle_challenges').select('id, title, description, target, unit, starts_on, ends_on').eq('circle_id', circleId).order('ends_on', { ascending: false }),
    'Memuat tantangan',
  ) as Omit<Challenge, 'total' | 'contributors'>[];
  const out: Challenge[] = [];
  for (const c of rows) {
    const p = ok(await sb.rpc('challenge_progress', { p_challenge: c.id }), 'Memuat progres') as { total: number; contributors: number }[];
    out.push({ ...c, total: Number(p[0]?.total ?? 0), contributors: Number(p[0]?.contributors ?? 0) });
  }
  return out;
}

export async function createChallenge(
  sb: SupabaseClient,
  circleId: string,
  c: { title: string; description: string; target: number; unit: string; starts_on: string; ends_on: string },
) {
  clientError(checkText(c.title, 80));
  clientError(checkText(c.description, 300, { allowEmpty: true }));
  ok(await sb.from('circle_challenges').insert({ circle_id: circleId, ...c }), 'Membuat tantangan');
}

export async function contribute(sb: SupabaseClient, challengeId: string, amount: number): Promise<number> {
  return Number(ok(await sb.rpc('contribute_challenge', { p_challenge: challengeId, p_amount: amount }), 'Berkontribusi'));
}

export async function leaderboard(sb: SupabaseClient, circleId: string, sinceDay: string): Promise<RankRow[]> {
  const rows = ok(await sb.rpc('circle_leaderboard', { p_circle: circleId, p_since: sinceDay }), 'Memuat peringkat') as RankRow[];
  return rows.map((r) => ({ ...r, points: Number(r.points) }));
}

export async function sendNudge(sb: SupabaseClient, circleId: string, toUser: string, kind: 'ingat' | 'doa') {
  ok(await sb.rpc('send_nudge', { p_circle: circleId, p_to: toUser, p_kind: kind }), 'Mengirim pengingat');
}

export async function myNudges(sb: SupabaseClient, uid: string) {
  const rows = ok(
    await sb.from('nudges').select('id, from_user, kind, created_at').eq('to_user', uid).order('created_at', { ascending: false }).limit(10),
    'Memuat pengingat',
  ) as { id: string; from_user: string; kind: 'ingat' | 'doa'; created_at: string }[];
  const names = await profileNames(sb, rows.map((r) => r.from_user));
  return rows.map((r) => ({ ...r, from: names.get(r.from_user) ?? 'Anggota' }));
}

// ---- misi bersama ----
export interface SharedMission {
  id: string;
  mission_id: string;
  day: string;
  min_people: number;
  participants: { user_id: string; name: string; status: 'joined' | 'done'; confirmed: boolean }[];
}

export async function loadSharedMissions(sb: SupabaseClient, circleId: string, sinceDay: string): Promise<SharedMission[]> {
  const rows = ok(await sb.from('shared_missions').select('id, mission_id, day, min_people').eq('circle_id', circleId).gte('day', sinceDay).order('day', { ascending: false }), 'Memuat misi bersama') as Omit<SharedMission, 'participants'>[];
  if (!rows.length) return [];
  const parts = ok(await sb.from('shared_participants').select('shared_id, user_id, status, confirmed_by').in('shared_id', rows.map((r) => r.id)), 'Memuat peserta') as { shared_id: string; user_id: string; status: 'joined' | 'done'; confirmed_by: string | null }[];
  const names = await profileNames(sb, [...new Set(parts.map((p) => p.user_id))]);
  return rows.map((r) => ({
    ...r,
    participants: parts.filter((p) => p.shared_id === r.id).map((p) => ({ user_id: p.user_id, name: names.get(p.user_id) ?? 'Anggota', status: p.status, confirmed: !!p.confirmed_by })),
  }));
}

export const startSharedMission = async (sb: SupabaseClient, circleId: string, missionId: string, day: string) =>
  ok(await sb.rpc('start_shared_mission', { p_circle: circleId, p_mission: missionId, p_day: day }), 'Memulai misi bersama') as string;
export const joinSharedMission = async (sb: SupabaseClient, id: string) => ok(await sb.rpc('join_shared_mission', { p_shared: id }), 'Bergabung');
export const markSharedDone = async (sb: SupabaseClient, id: string) => ok(await sb.rpc('mark_shared_done', { p_shared: id }), 'Menandai selesai');
export const confirmSharedDone = async (sb: SupabaseClient, id: string, userId: string) =>
  ok(await sb.rpc('confirm_shared_done', { p_shared: id, p_user: userId }), 'Mengonfirmasi');

export const deleteMyAccount = async (sb: SupabaseClient) => ok(await sb.rpc('delete_my_account'), 'Menghapus akun');
