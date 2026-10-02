/** Validasi konten: menolak item tanpa sumber, derajat lemah, atau struktur salah. */
import fs from 'node:fs';
import path from 'node:path';
import { validateAdhkar, validateMissions, validateQuotes } from '../src/content/validate';

const root = path.resolve(__dirname, '..');
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const errors = [
  ...validateQuotes(read('src/content/quotes.generated.json')),
  ...validateMissions(read('src/content/missions.generated.json')),
  ...validateAdhkar(read('src/content/adhkar.generated.json')),
];
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('Konten valid.');
