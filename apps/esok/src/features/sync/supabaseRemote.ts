import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeyEnvelope } from '@/features/security/e2ee';
import type { Remote, RemoteRow, SyncTable } from './engine';

const PUSH_FN: Record<SyncTable, string> = { deeds: 'push_deeds', private_items: 'push_private_items' };
const PAGE = 500;

/** Adaptor Supabase: push via RPC (LWW di server), pull via cursor `synced_at`. */
export function createSupabaseRemote(client: SupabaseClient, userId: string): Remote {
  return {
    async push(table, rows) {
      const { error } = await client.rpc(PUSH_FN[table], { rows });
      if (error) throw new Error(`Push ${table} gagal: ${error.message}`);
    },
    async pull(table, cursor) {
      let q = client.from(table).select('*').eq('user_id', userId).order('synced_at', { ascending: true }).limit(PAGE);
      if (cursor) q = q.gt('synced_at', cursor);
      const { data, error } = await q;
      if (error) throw new Error(`Pull ${table} gagal: ${error.message}`);
      const rows = (data ?? []) as RemoteRow[];
      const last = rows[rows.length - 1];
      return { rows, cursor: last ? String(last.synced_at) : cursor };
    },
  };
}

export async function fetchEnvelope(client: SupabaseClient, userId: string): Promise<KeyEnvelope | null> {
  const { data, error } = await client.from('key_envelopes').select('envelope').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Gagal mengambil envelope: ${error.message}`);
  return (data?.envelope as KeyEnvelope | undefined) ?? null;
}

export async function putEnvelope(client: SupabaseClient, userId: string, envelope: KeyEnvelope): Promise<void> {
  const { error } = await client
    .from('key_envelopes')
    .upsert({ user_id: userId, envelope, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Gagal menyimpan envelope: ${error.message}`);
}
