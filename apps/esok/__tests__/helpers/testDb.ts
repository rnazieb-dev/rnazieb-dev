import Database from 'better-sqlite3';
import { migrate } from '@/db/migrations';
import type { Db, SqlValue } from '@/db/types';

export function createTestDb(): Db {
  const raw = new Database(':memory:');
  const db: Db = {
    exec: async (sql) => {
      raw.exec(sql);
    },
    run: async (sql, params = []) => {
      raw.prepare(sql).run(...(params as SqlValue[]));
    },
    all: async <T,>(sql: string, params: SqlValue[] = []) => raw.prepare(sql).all(...params) as T[],
    get: async <T,>(sql: string, params: SqlValue[] = []) => raw.prepare(sql).get(...params) as T | undefined,
    // Tes berjalan serial pada koneksi tunggal: cukup BEGIN/COMMIT manual.
    transaction: async <T,>(fn: () => Promise<T>) => {
      raw.exec('BEGIN');
      try {
        const r = await fn();
        raw.exec('COMMIT');
        return r;
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return db;
}

export async function createMigratedTestDb(): Promise<Db> {
  const db = createTestDb();
  await migrate(db);
  return db;
}
