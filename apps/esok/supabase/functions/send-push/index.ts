// Edge Function (Deno): kirim push saat ada "nudge" baru.
// Dipanggil oleh Database Webhook (INSERT pada public.nudges) dengan header x-webhook-secret.
// PRIVASI: isi push hanya nama tampilan pengirim + teks baku. Tidak pernah membaca private_items.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const TEXT = {
  ingat: (n: string) => `${n} mengajakmu: satu kebaikan kecil hari ini?`,
  doa: (n: string) => `${n} mendoakanmu. Aamiin.`,
} as const;

Deno.serve(async (req) => {
  if (!SECRET || req.headers.get('x-webhook-secret') !== SECRET) return new Response('forbidden', { status: 403 });
  const body = await req.json();
  if (body.type !== 'INSERT' || body.table !== 'nudges') return new Response('ignored');
  const { from_user, to_user, kind } = body.record as { from_user: string; to_user: string; kind: 'ingat' | 'doa' };
  if (!(kind in TEXT)) return new Response('bad kind', { status: 400 });

  const { data: from } = await sb.from('profiles').select('display_name').eq('id', from_user).single();
  const { data: tokens } = await sb.from('push_tokens').select('token').eq('user_id', to_user);
  if (!tokens?.length) return new Response('no tokens');

  const messages = tokens.map((t) => ({ to: t.token, title: 'Esok', body: TEXT[kind](from?.display_name ?? 'Seorang teman'), sound: null }));
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  return new Response(await res.text(), { status: res.status });
});
