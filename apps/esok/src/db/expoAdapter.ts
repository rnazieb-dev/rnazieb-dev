import * as SQLite from 'expo-sqlite';
import type { Db, SqlValue } from './types';

export async function openExpoDb(name = 'esok.db'): Promise<Db> {
  const raw = await SQLite.openDatabaseAsync(name);
  await raw.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return {
    exec: (sql) => raw.execAsync(sql),
    run: async (sql, params = []) => {
      await raw.runAsync(sql, params as SqlValue[]);
    },
    all: <T,>(sql: string, params: SqlValue[] = []) => raw.getAllAsync<T>(sql, params),
    get: async <T,>(sql: string, params: SqlValue[] = []) => (await raw.getFirstAsync<T>(sql, params)) ?? undefined,
    transaction: async <T,>(fn: () => Promise<T>) => {
      let result!: T;
      await raw.withTransactionAsync(async () => {
        result = await fn();
      });
      return result;
    },
  };
}
