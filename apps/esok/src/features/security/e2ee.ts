/**
 * Enkripsi end-to-end untuk "amalan rahasia" & refleksi pribadi.
 *
 * Desain:
 *  - DEK (kunci data) acak 32 byte dibuat di perangkat. Server TIDAK pernah melihatnya.
 *  - DEK dibungkus (wrap) dua kali di "envelope" yang boleh disimpan di cloud:
 *      1) KEK dari passphrase (Argon2id) — untuk membuka di perangkat baru,
 *      2) kunci pemulihan acak 256-bit — jika passphrase lupa.
 *  - Isi item dienkripsi XChaCha20-Poly1305; AAD mengikat ciphertext ke id+kind
 *    sehingga server tidak bisa menukar/menyalin blob antar-item.
 *  - Kehilangan passphrase DAN kunci pemulihan = data cloud tidak dapat dipulihkan (disengaja).
 */
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import { randomBytes } from '@/lib/random';

export interface KdfParams {
  alg: 'argon2id';
  t: number; // iterasi
  m: number; // memori KiB
  p: number;
  salt: string; // base64
}

export interface Wrapped {
  nonce: string; // base64
  ct: string; // base64
}

export interface KeyEnvelope {
  v: 1;
  kdf: KdfParams;
  byPassphrase: Wrapped;
  byRecovery: Wrapped;
}

/** Parameter baku (OWASP minimum argon2id: m=19 MiB, t=2, p=1). */
export const DEFAULT_KDF = { t: 2, m: 19456, p: 1 } as const;

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---- base64 / base32 (tanpa dependensi, aman di Hermes) ----
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function toBase64(b: Uint8Array): string {
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const a = b[i] as number;
    const c = b[i + 1];
    const d = b[i + 2];
    const n = (a << 16) | ((c ?? 0) << 8) | (d ?? 0);
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!;
    out += c === undefined ? '=' : B64[(n >> 6) & 63]!;
    out += d === undefined ? '=' : B64[n & 63]!;
  }
  return out;
}
export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new Error('Base64 tidak valid');
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford
export function encodeRecoveryKey(bytes: Uint8Array): string {
  let bits = 0;
  let buf = 0;
  let out = '';
  for (const b of bytes) {
    buf = (buf << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(buf >> bits) & 31];
    }
  }
  if (bits > 0) out += B32[(buf << (5 - bits)) & 31];
  return (out.match(/.{1,4}/g) ?? []).join('-');
}
export function decodeRecoveryKey(text: string): Uint8Array {
  const clean = text.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  const out: number[] = [];
  let bits = 0;
  let buf = 0;
  for (const ch of clean) {
    const v = B32.indexOf(ch);
    if (v < 0) throw new Error('Kunci pemulihan tidak valid');
    buf = (buf << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  const bytes = new Uint8Array(out.slice(0, 32));
  if (bytes.length !== 32) throw new Error('Kunci pemulihan harus 256-bit');
  return bytes;
}

// ---- primitif ----
function seal(key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): Wrapped {
  const nonce = randomBytes(24);
  const ct = xchacha20poly1305(key, nonce, aad).encrypt(plaintext);
  return { nonce: toBase64(nonce), ct: toBase64(ct) };
}
function open(key: Uint8Array, w: Wrapped, aad: Uint8Array): Uint8Array {
  return xchacha20poly1305(key, fromBase64(w.nonce), aad).decrypt(fromBase64(w.ct));
}

const AAD_PASS = enc.encode('esok:dek:passphrase:v1');
const AAD_RECOVERY = enc.encode('esok:dek:recovery:v1');

async function deriveKek(passphrase: string, kdf: KdfParams): Promise<Uint8Array> {
  return argon2idAsync(enc.encode(passphrase.normalize('NFKC')), fromBase64(kdf.salt), {
    t: kdf.t,
    m: kdf.m,
    p: kdf.p,
    dkLen: 32,
  });
}

export function generateDek(): Uint8Array {
  return randomBytes(32);
}

export interface CreatedVault {
  envelope: KeyEnvelope;
  /** Tampilkan SEKALI ke pengguna agar disimpan; tidak disimpan di server. */
  recoveryKey: string;
}

/** Bungkus DEK (yang sudah ada/baru) dengan passphrase + kunci pemulihan. */
export async function createEnvelope(
  dek: Uint8Array,
  passphrase: string,
  kdfCost: { t: number; m: number; p: number } = DEFAULT_KDF,
): Promise<CreatedVault> {
  if (passphrase.length < 8) throw new Error('Passphrase minimal 8 karakter');
  const kdf: KdfParams = { alg: 'argon2id', ...kdfCost, salt: toBase64(randomBytes(16)) };
  const kek = await deriveKek(passphrase, kdf);
  const recovery = randomBytes(32);
  return {
    envelope: { v: 1, kdf, byPassphrase: seal(kek, dek, AAD_PASS), byRecovery: seal(recovery, dek, AAD_RECOVERY) },
    recoveryKey: encodeRecoveryKey(recovery),
  };
}

export async function unlockWithPassphrase(env: KeyEnvelope, passphrase: string): Promise<Uint8Array> {
  const kek = await deriveKek(passphrase, env.kdf);
  try {
    return open(kek, env.byPassphrase, AAD_PASS);
  } catch {
    throw new Error('Passphrase salah');
  }
}

export function unlockWithRecoveryKey(env: KeyEnvelope, recoveryKey: string): Uint8Array {
  try {
    return open(decodeRecoveryKey(recoveryKey), env.byRecovery, AAD_RECOVERY);
  } catch {
    throw new Error('Kunci pemulihan salah');
  }
}

/** Ganti passphrase tanpa mengenkripsi ulang data (DEK tetap). Kunci pemulihan lama tetap berlaku. */
export async function rewrapPassphrase(
  env: KeyEnvelope,
  dek: Uint8Array,
  newPassphrase: string,
  kdfCost: { t: number; m: number; p: number } = DEFAULT_KDF,
): Promise<KeyEnvelope> {
  if (newPassphrase.length < 8) throw new Error('Passphrase minimal 8 karakter');
  const kdf: KdfParams = { alg: 'argon2id', ...kdfCost, salt: toBase64(randomBytes(16)) };
  const kek = await deriveKek(newPassphrase, kdf);
  return { ...env, kdf, byPassphrase: seal(kek, dek, AAD_PASS) };
}

// ---- item ----
export type ItemKind = 'deed' | 'reflection' | 'ledger';

export interface Sealed {
  ciphertext: string; // base64
  nonce: string; // base64
}

const itemAad = (id: string, kind: ItemKind) => enc.encode(`esok:item:v1|${kind}|${id}`);

export function encryptItem(dek: Uint8Array, id: string, kind: ItemKind, payload: unknown): Sealed {
  const w = seal(dek, enc.encode(JSON.stringify(payload)), itemAad(id, kind));
  return { ciphertext: w.ct, nonce: w.nonce };
}

export function decryptItem<T>(dek: Uint8Array, id: string, kind: ItemKind, sealed: Sealed): T {
  const bytes = open(dek, { ct: sealed.ciphertext, nonce: sealed.nonce }, itemAad(id, kind));
  return JSON.parse(dec.decode(bytes)) as T;
}
