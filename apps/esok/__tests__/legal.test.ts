import legal from '@/content/legal.generated.json';

type Block = { t: string; text: string };
const data = legal as unknown as Record<'en' | 'id', Record<'privacy' | 'terms', { title: string; blocks: Block[] }>>;

describe('dokumen hukum', () => {
  for (const lang of ['en', 'id'] as const) {
    for (const doc of ['privacy', 'terms'] as const) {
      const d = data[lang][doc];
      it(`${doc}.${lang}: judul, bagian, dan tidak ada placeholder mentah`, () => {
        expect(d.title).toMatch(/NAFS/);
        expect(d.blocks.filter((b) => b.t === 'h2').length).toBeGreaterThanOrEqual(10);
        for (const b of d.blocks) expect(b.text).not.toMatch(/\{\{/);
      });
    }
  }
  it('kebijakan privasi memuat jaminan inti (tanpa iklan/pelacak, E2EE, lokasi tidak dikirim, hak hapus)', () => {
    const en = data.en.privacy.blocks.map((b) => b.text).join('\n').toLowerCase();
    for (const k of ['end-to-end encrypted', 'no ads', 'never sell', 'never sent to us', 'delete account']) expect(en).toContain(k);
  });
  it('syarat memuat: bukan otoritas agama, bukan zakat, donasi sukarela, usia 13', () => {
    const en = data.en.terms.blocks.map((b) => b.text).join('\n').toLowerCase();
    for (const k of ['not a religious authority', 'not zakat', 'voluntary', '13']) expect(en).toContain(k);
  });
});
