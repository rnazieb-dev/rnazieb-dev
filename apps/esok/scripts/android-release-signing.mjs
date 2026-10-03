/**
 * Setelah `expo prebuild`, ganti tanda tangan build rilis dari kunci debug ke keystore sendiri
 * bila variabel lingkungan tersedia: ANDROID_KEYSTORE_FILE, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD.
 * Tanpa variabel itu, tidak mengubah apa pun (APK tetap bertanda tangan debug: cukup untuk uji pasang, bukan untuk Play Store).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const need = ['ANDROID_KEYSTORE_FILE', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD'];
const missing = need.filter((k) => !process.env[k]);
if (missing.length === need.length) {
  console.log('android-release-signing: tanpa keystore → APK bertanda tangan debug.');
  process.exit(0);
}
if (missing.length) {
  console.error(`android-release-signing: variabel kurang: ${missing.join(', ')}`);
  process.exit(1);
}
const p = 'android/app/build.gradle';
let g = readFileSync(p, 'utf8');
if (g.includes('signingConfigs.release')) process.exit(0);
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const block = `        release {
            storeFile file('${esc(process.env.ANDROID_KEYSTORE_FILE)}')
            storePassword '${esc(process.env.ANDROID_KEYSTORE_PASSWORD)}'
            keyAlias '${esc(process.env.ANDROID_KEY_ALIAS)}'
            keyPassword '${esc(process.env.ANDROID_KEY_PASSWORD)}'
        }
`;
const before = g;
g = g.replace(/(signingConfigs \{\n\s+debug \{[\s\S]*?\n\s+\}\n)/, `$1${block}`);
g = g.replace(/(release \{\n\s+\/\/ Caution![\s\S]*?\n\s+)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.release');
if (g === before || !g.includes('signingConfigs.release')) {
  console.error('android-release-signing: pola build.gradle tidak cocok (templat Expo berubah?).');
  process.exit(1);
}
writeFileSync(p, g);
console.log('android-release-signing: build rilis memakai keystore sendiri.');
