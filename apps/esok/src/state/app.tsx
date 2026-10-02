import type { Session } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { openExpoDb } from '@/db/expoAdapter';
import { migrate } from '@/db/migrations';
import { getSetting, setSetting, wipeLocal } from '@/db/repos';
import type { Db } from '@/db/types';
import { DEFAULT_REMINDERS, type ReminderSettings } from '@/features/reminders/schedule';
import { configureNotifications, rescheduleReminders } from '@/features/reminders/notifications';
import type { AlertKey } from '@/features/salat/logic';
import type { CalcMethod } from '@/features/reminders/prayerTimes';
import type { LangSetting } from '@/i18n';
import { authenticate, ensureLocalDek, readDek, wipeDek } from '@/features/security/vault';
import { canSyncAs, canUseLocalData } from '@/features/sync/binding';
import { runFullSync } from '@/features/sync/service';
import { type DayKey, toDayKey } from '@/lib/dates';
import { getSupabase, isCloudConfigured } from '@/lib/supabase';
import { setRandomSource, uuid } from '@/lib/random';

export interface AppSettings {
  onboarded: boolean;
  /** Banner pengenalan di Beranda sudah ditutup ("Nanti saja"). */
  introDismissed: boolean;
  /** Pengingat adzan per waktu salat (butuh lokasi). */
  prayerAlerts: Partial<Record<AlertKey, boolean>>;
  /** Bahasa antarmuka; 'system' = ikuti perangkat. */
  language: LangSetting;
  /** Metode hitung jadwal salat & mazhab Asar. */
  calcMethod: CalcMethod;
  asrHanafi: boolean;
  /** Nama tempat (hasil reverse geocode di perangkat) untuk ditampilkan. */
  placeName: string | null;
  displayName: string;
  seed: string;
  reminders: ReminderSettings;
  prayerMode: 'tetap' | 'salat';
  coords: { latitude: number; longitude: number } | null;
  appLock: boolean;
  /** "Mode ikhlas": sembunyikan angka publik milik sendiri. */
  honorMode: boolean;
  showRankings: boolean;
  hideStreak: boolean;
  cloudEnabled: boolean;
  /** Pengguna belum 13 tahun: fitur grup/cloud dinonaktifkan. */
  isMinor: boolean;
  pushNudges: boolean;
  /** Akun pemilik penyimpanan lokal ini (lihat features/sync/binding). */
  boundUserId: string | null;
  /** Pengingat dzikir pagi/petang (opsional). */
  adhkarReminder: boolean;
  /** Pengingat jatuh tempo catatan utang/amanah (teks generik). */
  dueReminders: boolean;
}

const DEFAULTS = (): AppSettings => ({
  onboarded: false,
  introDismissed: false,
  prayerAlerts: {},
  language: 'system',
  calcMethod: 'auto',
  asrHanafi: false,
  placeName: null,
  displayName: 'Hamba Allah',
  seed: '',
  reminders: DEFAULT_REMINDERS,
  prayerMode: 'tetap',
  coords: null,
  appLock: false,
  honorMode: false,
  showRankings: true,
  hideStreak: false,
  cloudEnabled: false,
  isMinor: false,
  pushNudges: false,
  boundUserId: null,
  adhkarReminder: false,
  dueReminders: true,
});

type SyncStatus = { state: 'idle' | 'syncing' | 'ok' | 'error'; at?: string; message?: string };

interface AppContextValue {
  ready: boolean;
  db: Db;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  today: DayKey;
  version: number;
  bump: () => void;
  /** Kunci vault di memori (null = terkunci). */
  dek: Uint8Array | null;
  /** Buka vault (biometrik/kode sandi perangkat). Mengembalikan DEK atau null jika ditolak. */
  unlockVault: () => Promise<Uint8Array | null>;
  /** Sesi akun aktif bukan pemilik data lokal: seluruh data lokal harus disembunyikan. */
  accountMismatch: boolean;
  /** Hapus data lokal + kunci vault (dipakai saat berganti akun). */
  resetLocalData: () => Promise<void>;
  lockVault: () => void;
  appLocked: boolean;
  setAppLocked: (v: boolean) => void;
  session: Session | null;
  cloudConfigured: boolean;
  sync: SyncStatus;
  syncNow: () => Promise<void>;
  reschedule: () => Promise<void>;
}

const Ctx = createContext<AppContextValue | null>(null);

const VAULT_IDLE_MS = 60_000;

/** Penanda siklus-hidup (satu AppProvider per proses); hanya dimutasi di callback/event. */
const flags = { backgroundAt: null as number | null, syncing: false };

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS());
  const [today, setToday] = useState<DayKey>(toDayKey(new Date()));
  const [version, setVersion] = useState(0);
  const [dek, setDek] = useState<Uint8Array | null>(null);
  const [appLocked, setAppLocked] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sync, setSync] = useState<SyncStatus>({ state: 'idle' });

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // ---- init ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRandomSource((n) => Crypto.getRandomBytes(n));
      const d = await openExpoDb();
      await migrate(d);
      const stored = await getSetting<Partial<AppSettings>>(d, 'app', {});
      const merged: AppSettings = { ...DEFAULTS(), ...stored };
      if (!merged.seed) {
        merged.seed = uuid();
        await setSetting(d, 'app', merged);
      }
      configureNotifications();
      if (cancelled) return;
      setSettings(merged);
      setAppLocked(merged.appLock);
      setDb(d);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- sesi cloud ----
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      if (!db) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      await setSetting(db, 'app', next);
      bump();
    },
    [db, settings, bump],
  );

  const reschedule = useCallback(async () => {
    if (!db) return;
    await rescheduleReminders(db, settings.reminders, { mode: settings.prayerMode, coords: settings.coords ?? undefined }, settings.seed, {
      adhkar: settings.adhkarReminder,
      due: settings.dueReminders,
      prayerAlerts: settings.prayerAlerts,
      coords: settings.coords ?? undefined,
      calc: { method: settings.calcMethod, hanafi: settings.asrHanafi },
    });
  }, [db, settings.reminders, settings.prayerMode, settings.coords, settings.seed, settings.adhkarReminder, settings.dueReminders, settings.prayerAlerts, settings.calcMethod, settings.asrHanafi]);

  useEffect(() => {
    // Jadwalkan ulang setiap pengaturan pengingat berubah. Pengingat adzan boleh aktif walau pengenalan belum selesai.
    const anyAdzan = Object.values(settings.prayerAlerts).some(Boolean);
    if (db && (settings.onboarded || anyAdzan)) void reschedule();
  }, [db, settings.onboarded, settings.prayerAlerts, reschedule]);

  const accountMismatch = !canUseLocalData(settings.boundUserId, session?.user.id);

  const resetLocalData = useCallback(async () => {
    if (!db) return;
    await wipeLocal(db);
    await wipeDek();
    setDek(null);
    // wipeLocal ikut menghapus pengaturan tersimpan: tulis ulang dengan ikatan yang dilepas.
    await updateSettings({ cloudEnabled: false, boundUserId: null, onboarded: false, appLock: false });
  }, [db, updateSettings]);

  const unlockVault = useCallback(async (): Promise<Uint8Array | null> => {
    if (accountMismatch) return null;
    if (dek) return dek;
    const ok = await authenticate('Buka amalan rahasia Anda');
    if (!ok) return null;
    const key = (await readDek()) ?? (await ensureLocalDek());
    setDek(key);
    return key;
  }, [dek, accountMismatch]);

  const lockVault = useCallback(() => setDek(null), []);

  const syncNow = useCallback(async () => {
    const sb = getSupabase();
    if (!db || !sb || !session || !settings.cloudEnabled || flags.syncing) return;
    if (!canSyncAs(settings.boundUserId, session.user.id)) {
      // Jangan pernah mendorong/menarik data lintas akun.
      setSync({ state: 'error', message: 'Data lokal di perangkat ini milik akun lain.' });
      return;
    }
    flags.syncing = true;
    setSync({ state: 'syncing' });
    try {
      await runFullSync(db, sb, session.user.id, dek);
      setSync({ state: 'ok', at: new Date().toISOString() });
      bump();
    } catch (e) {
      setSync({ state: 'error', message: e instanceof Error ? e.message : 'Sinkron gagal' });
    } finally {
      flags.syncing = false;
    }
  }, [db, session, settings.cloudEnabled, settings.boundUserId, dek, bump]);

  // ---- siklus app: hari baru, kunci otomatis, sync, jadwal ulang ----
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' || s === 'inactive') {
        flags.backgroundAt ??= Date.now();
        return;
      }
      const away = flags.backgroundAt ? Date.now() - flags.backgroundAt : 0;
      flags.backgroundAt = null;
      setToday(toDayKey(new Date()));
      if (away > VAULT_IDLE_MS) {
        setDek(null);
        if (settings.appLock) setAppLocked(true);
      }
      void syncNow();
      void reschedule();
    });
    return () => sub.remove();
  }, [settings.appLock, syncNow, reschedule]);

  const userId = session?.user.id;
  useEffect(() => {
    // Sinkron otomatis saat login/cloud diaktifkan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId && settings.cloudEnabled) void syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, settings.cloudEnabled]);

  const value = useMemo<AppContextValue | null>(
    () =>
      db
        ? {
            ready: true,
            db,
            settings,
            updateSettings,
            today,
            version,
            bump,
            dek,
            unlockVault,
            accountMismatch,
            resetLocalData,
            lockVault,
            appLocked,
            setAppLocked,
            session,
            cloudConfigured: isCloudConfigured(),
            sync,
            syncNow,
            reschedule,
          }
        : null,
    [db, settings, updateSettings, today, version, bump, dek, unlockVault, accountMismatch, resetLocalData, lockVault, appLocked, session, sync, syncNow, reschedule],
  );

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp harus di dalam AppProvider');
  return v;
}

/** Query DB yang dihitung ulang saat `version` berubah (setelah penulisan/sync). */
export function useDbQuery<T>(fn: (db: Db) => Promise<T>, deps: readonly unknown[], initial: T): { data: T; loading: boolean; error: string | null } {
  const { db, version } = useApp();
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    // Hook pengambilan data: menandai "memuat" saat permintaan baru dimulai adalah disengaja.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fn(db)
      .then((r) => {
        if (alive) {
          setData(r);
          setError(null);
        }
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, ...deps]);
  return { data, loading, error };
}
