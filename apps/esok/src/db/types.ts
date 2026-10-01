export type SqlValue = string | number | null;

/** Antarmuka DB minimal: dipenuhi expo-sqlite (app) dan better-sqlite3 (tes). */
export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  get<T>(sql: string, params?: SqlValue[]): Promise<T | undefined>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
