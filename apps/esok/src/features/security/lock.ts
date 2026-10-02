import { argon2idAsync } from '@noble/hashes/argon2.js';
import { fromBase64, toBase64 } from './e2ee';
import { randomBytes } from '@/lib/random';

/** Jeda setelah gagal berulang: 0 untuk <3 kali, lalu 30 dtk, 60, 120 ... maks 15 menit. */
export function backoffSeconds(failures: number): number {
  if (failures < 3) return 0;
  return Math.min(900, 30 * 2 ** (failures - 3));
}

export interface PinRecord {
  salt: string;
  hash: string;
  cost: { t: number; m: number; p: number };
}

const enc = new TextEncoder();
export const PIN_COST = { t: 2, m: 8192, p: 1 } as const;

export async function createPinRecord(pin: string, cost: { t: number; m: number; p: number } = PIN_COST): Promise<PinRecord> {
  if (!/^\d{6}$/.test(pin)) throw new Error('PIN harus 6 digit');
  const salt = randomBytes(16);
  const hash = await argon2idAsync(enc.encode(pin), salt, { ...cost, dkLen: 32 });
  return { salt: toBase64(salt), hash: toBase64(hash), cost };
}

export async function verifyPin(pin: string, rec: PinRecord): Promise<boolean> {
  const h = await argon2idAsync(enc.encode(pin), fromBase64(rec.salt), { ...rec.cost, dkLen: 32 });
  const expected = fromBase64(rec.hash);
  // Perbandingan waktu-konstan.
  let diff = h.length ^ expected.length;
  for (let i = 0; i < h.length; i++) diff |= (h[i] as number) ^ (expected[i] ?? 0);
  return diff === 0;
}

/** Kunci aplikasi hanya boleh aktif bila ada cara membukanya (kunci layar perangkat atau PIN). */
export function canEnableAppLock(a: { secured: boolean; hasPin: boolean }): boolean {
  return a.secured || a.hasPin;
}

/** Apakah gerbang kunci masih bisa dibuka pengguna? Jika tidak, harus dibuka otomatis (hindari terkunci permanen). */
export function lockUsable(a: { secured: boolean; hasPin: boolean }): boolean {
  return a.secured || a.hasPin;
}
