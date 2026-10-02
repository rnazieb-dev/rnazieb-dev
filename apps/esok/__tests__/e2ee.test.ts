import {
  createEnvelope,
  decodeRecoveryKey,
  decryptItem,
  encodeRecoveryKey,
  encryptItem,
  fromBase64,
  generateDek,
  rewrapPassphrase,
  toBase64,
  unlockWithPassphrase,
  unlockWithRecoveryKey,
} from '@/features/security/e2ee';

// Biaya KDF kecil hanya untuk tes (parameter produksi: lihat DEFAULT_KDF).
const FAST = { t: 1, m: 8, p: 1 };

describe('e2ee', () => {
  it('base64 round-trip', () => {
    for (const n of [0, 1, 2, 3, 4, 31, 32, 33]) {
      const b = new Uint8Array(n).map((_, i) => (i * 37) & 255);
      expect(Array.from(fromBase64(toBase64(b)))).toEqual(Array.from(b));
    }
  });

  it('kunci pemulihan base32 round-trip & toleran salah ketik', () => {
    const b = new Uint8Array(32).map((_, i) => (i * 11 + 3) & 255);
    const k = encodeRecoveryKey(b);
    expect(k).toMatch(/^([0-9A-Z]{4}-)+[0-9A-Z]{1,4}$/);
    expect(Array.from(decodeRecoveryKey(k))).toEqual(Array.from(b));
    expect(Array.from(decodeRecoveryKey(k.toLowerCase().replace(/-/g, ' ')))).toEqual(Array.from(b));
  });

  it('item: enkripsi → dekripsi', () => {
    const dek = generateDek();
    const s = encryptItem(dek, 'id1', 'deed', { title: 'sedekah subuh' });
    expect(decryptItem<{ title: string }>(dek, 'id1', 'deed', s).title).toBe('sedekah subuh');
    expect(s.ciphertext).not.toContain('sedekah');
  });

  it('AAD mengikat ciphertext ke id & kind (server tidak bisa menukar blob)', () => {
    const dek = generateDek();
    const s = encryptItem(dek, 'id1', 'deed', { a: 1 });
    expect(() => decryptItem(dek, 'id2', 'deed', s)).toThrow();
    expect(() => decryptItem(dek, 'id1', 'reflection', s)).toThrow();
  });

  it('kunci salah gagal; ciphertext dirusak gagal', () => {
    const dek = generateDek();
    const s = encryptItem(dek, 'x', 'deed', { a: 1 });
    expect(() => decryptItem(generateDek(), 'x', 'deed', s)).toThrow();
    const bytes = fromBase64(s.ciphertext);
    bytes[0] = (bytes[0] as number) ^ 1;
    expect(() => decryptItem(dek, 'x', 'deed', { ...s, ciphertext: toBase64(bytes) })).toThrow();
  });

  it('envelope: buka dengan passphrase & kunci pemulihan', async () => {
    const dek = generateDek();
    const { envelope, recoveryKey } = await createEnvelope(dek, 'passphrase-kuat-123', FAST);
    expect(Array.from(await unlockWithPassphrase(envelope, 'passphrase-kuat-123'))).toEqual(Array.from(dek));
    expect(Array.from(unlockWithRecoveryKey(envelope, recoveryKey))).toEqual(Array.from(dek));
    await expect(unlockWithPassphrase(envelope, 'salah-salah-salah')).rejects.toThrow('Passphrase salah');
    expect(() => unlockWithRecoveryKey(envelope, encodeRecoveryKey(new Uint8Array(32)))).toThrow();
  });

  it('ganti passphrase: DEK tetap, passphrase lama tidak berlaku, kunci pemulihan tetap', async () => {
    const dek = generateDek();
    const { envelope, recoveryKey } = await createEnvelope(dek, 'passphrase-lama-1', FAST);
    const next = await rewrapPassphrase(envelope, dek, 'passphrase-baru-2', FAST);
    expect(Array.from(await unlockWithPassphrase(next, 'passphrase-baru-2'))).toEqual(Array.from(dek));
    await expect(unlockWithPassphrase(next, 'passphrase-lama-1')).rejects.toThrow();
    expect(Array.from(unlockWithRecoveryKey(next, recoveryKey))).toEqual(Array.from(dek));
  });

  it('menolak passphrase pendek', async () => {
    await expect(createEnvelope(generateDek(), 'pendek', FAST)).rejects.toThrow();
  });
});
