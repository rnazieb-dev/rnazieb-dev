/**
 * Membangun src/content/quran.generated.json dari paket `quran-json` (CC-BY-4.0):
 *  - Teks Arab Utsmani: The Noble Qur'an Encyclopedia (quranenc.com)
 *  - Transliterasi Latin: tanzil.net
 *  - Terjemah Indonesia: Kementerian Agama RI (via quranenc.com)
 * Terjemah lain (mis. Saheeh International) TIDAK disertakan sampai izin penggunaannya jelas.
 * Format ringkas: { s: [[nameAr, translit, nameId, type, count]], v: [[[ar, tr, id], ...] per surah] }
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/quran-json/dist/chapters/id');
const s = [];
const v = [];
for (let i = 1; i <= 114; i++) {
  const c = JSON.parse(readFileSync(join(src, `${i}.json`), 'utf8'));
  s.push([c.name, c.transliteration, c.translation, c.type === 'meccan' ? 'm' : 'd', c.total_verses]);
  v.push(c.verses.map((x) => [x.text, x.transliteration, x.translation]));
}
const total = v.reduce((n, x) => n + x.length, 0);
if (total !== 6236) throw new Error(`jumlah ayat ${total} ≠ 6236`);
writeFileSync(join(root, 'src/content/quran.generated.json'), JSON.stringify({ s, v }));
console.log(`quran.generated.json: 114 surah, ${total} ayat`);
