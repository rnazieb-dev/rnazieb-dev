import type { SupabaseClient } from '@supabase/supabase-js';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { fromBase64, generateDek, toBase64, createEnvelope, unlockWithPassphrase, unlockWithRecoveryKey, type KeyEnvelope } from './e2ee';
import { rekeyPrivateItems } from './rekey';
import { fetchEnvelope, putEnvelope } from '@/features/sync/supabaseRemote';
import type { Db } from '@/db/types';

const DEK_KEY = 'esok.dek.v1';
const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function readDek(): Promise<Uint8Array | null> {
  const v = await SecureStore.getItemAsync(DEK_KEY, opts);
  return v ? fromBase64(v) : null;
}

export async function storeDek(dek: Uint8Array): Promise<void> {
  await SecureStore.setItemAsync(DEK_KEY, toBase64(dek), opts);
}

/** Buat kunci data lokal jika belum ada (mode lokal tanpa akun/passphrase). */
export async function ensureLocalDek(): Promise<Uint8Array> {
  const existing = await readDek();
  if (existing) return existing;
  const dek = generateDek();
  await storeDek(dek);
  return dek;
}

export async function wipeDek(): Promise<void> {
  await SecureStore.deleteItemAsync(DEK_KEY, opts);
}

export interface AuthAvailability {
  secured: boolean;
  biometric: boolean;
}

export async function authAvailability(): Promise<AuthAvailability> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return {
    secured: level !== LocalAuthentication.SecurityLevel.NONE,
    biometric: level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG || level === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK,
  };
}

/** Biometrik atau kode sandi perangkat. Mengembalikan true jika perangkat tak punya kunci layar (UI memberi peringatan). */
export async function authenticate(reason: string): Promise<boolean> {
  const { secured } = await authAvailability();
  if (!secured) return true;
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Batal', fallbackLabel: 'Gunakan kode sandi' });
  return r.success;
}

export interface CloudVaultResult {
  /** Hanya ada saat vault cloud BARU dibuat; tampilkan sekali dan minta pengguna menyimpannya. */
  recoveryKey?: string;
  dek: Uint8Array;
}

/**
 * Hubungkan vault ke akun cloud.
 *  - Belum ada envelope di cloud → bungkus DEK lokal dengan passphrase + kunci pemulihan, unggah.
 *  - Sudah ada (perangkat lain) → buka dengan passphrase/kunci pemulihan, enkripsi ulang item lokal ke DEK cloud.
 */
export async function connectCloudVault(
  client: SupabaseClient,
  userId: string,
  db: Db,
  localDek: Uint8Array,
  secret: { passphrase?: string; recoveryKey?: string },
): Promise<CloudVaultResult> {
  const env: KeyEnvelope | null = await fetchEnvelope(client, userId);
  if (!env) {
    if (!secret.passphrase) throw new Error('Buat passphrase untuk mengamankan cadangan cloud.');
    const { envelope, recoveryKey } = await createEnvelope(localDek, secret.passphrase);
    await putEnvelope(client, userId, envelope);
    return { recoveryKey, dek: localDek };
  }
  const cloudDek = secret.recoveryKey
    ? unlockWithRecoveryKey(env, secret.recoveryKey)
    : await unlockWithPassphrase(env, secret.passphrase ?? '');
  if (toBase64(cloudDek) !== toBase64(localDek)) {
    await rekeyPrivateItems(db, localDek, cloudDek);
    await storeDek(cloudDek);
  }
  return { dek: cloudDek };
}
