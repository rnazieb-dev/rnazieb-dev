import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

/** Stub minimal skema Supabase (auth.users, auth.uid(), peran anon/authenticated). */
const PREAMBLE = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
`;

export async function makePg(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(PREAMBLE);
  const dir = path.resolve(__dirname, '../../supabase/migrations');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(path.join(dir, f), 'utf8'));
  }
  return db;
}

export const newUser = async (db: PGlite, name?: string): Promise<string> => {
  const id = randomUUID();
  await db.query('insert into auth.users(id) values ($1)', [id]);
  if (name) await db.query('update public.profiles set display_name = $2 where id = $1', [id, name]);
  return id;
};

type Q = <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;

/** Jalankan sebagai pengguna `authenticated` tertentu (RLS berlaku). null = tanpa login (anon). */
export async function asUser<T>(db: PGlite, userId: string | null, fn: (q: Q) => Promise<T>): Promise<T> {
  await db.exec(`set role ${userId ? 'authenticated' : 'anon'}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  const q: Q = async (sql, params) => (await db.query(sql, params)).rows as never;
  try {
    return await fn(q);
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

export const expectDenied = async (p: Promise<unknown>) => {
  await expect(p).rejects.toThrow();
};
