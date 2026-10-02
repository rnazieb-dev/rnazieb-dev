/**
 * Membangun ikon & splash final (PNG) dari SVG di bawah.
 * Motif: tunas kurma (bibit kurma — "tanamlah selagi sempat", HR. Ahmad) menyongsong fajar.
 * Pakai Chromium bawaan Playwright (PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium) agar tanpa dependensi native.
 * Jalankan: node scripts/build-assets.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const OUT = path.resolve(import.meta.dirname, '../assets');
mkdirSync(OUT, { recursive: true });

const BG_DARK = '#0F2A2A';
const GOLD_1 = '#F6E6B0';
const GOLD_2 = '#D6A93F';

const defs = (id) => `
  <defs>
    <linearGradient id="gold${id}" gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="800">
      <stop offset="0" stop-color="${GOLD_1}"/><stop offset="1" stop-color="${GOLD_2}"/>
    </linearGradient>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16494A"/><stop offset="1" stop-color="${BG_DARK}"/>
    </linearGradient>
    <radialGradient id="glow${id}" cx="512" cy="430" r="420" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3FA9A0" stop-opacity="0.60"/><stop offset="1" stop-color="#3FA9A0" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/** Tunas kurma: batang + tiga pelepah di atas gundukan tanah. Bounding box ≈ x330–694, y300–810. */
const sprout = (fill, ground) => `
  <g fill="${fill}" stroke="none">
    <path d="M512 640 C440 640 350 590 330 470 C430 480 500 540 512 640 Z"/>
    <path d="M512 640 C584 640 674 590 694 470 C594 480 524 540 512 640 Z"/>
    <path d="M512 560 C468 480 480 385 512 300 C544 385 556 480 512 560 Z"/>
  </g>
  <rect x="497" y="610" width="30" height="172" rx="15" fill="${fill}"/>
  <path d="M310 812 Q512 735 714 812" stroke="${ground}" stroke-width="24" stroke-linecap="round" fill="none"/>`;

const svg = (inner, size = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${inner}</svg>`;

const variants = {
  // iOS/Play: penuh tanpa transparansi & tanpa sudut membulat
  'icon.png': svg(`${defs('a')}
    <rect width="1024" height="1024" fill="url(#bga)"/><rect width="1024" height="1024" fill="url(#gloa)"/>
    <g transform="translate(0,-40)">${sprout('url(#golda)', '#6FC3BA')}</g>`.replace('url(#gloa)', 'url(#glowa)')),
  // Adaptive Android: latar & foreground terpisah; foreground di zona aman (~66%)
  'android-icon-background.png': svg(`${defs('b')}
    <rect width="1024" height="1024" fill="url(#bgb)"/><rect width="1024" height="1024" fill="url(#glowb)"/>`),
  'android-icon-foreground.png': svg(`${defs('c')}
    <g transform="translate(512 512) scale(0.92) translate(-512 -552)">${sprout('url(#goldc)', '#6FC3BA')}</g>`),
  'android-icon-monochrome.png': svg(`
    <g transform="translate(512 512) scale(0.92) translate(-512 -552)">${sprout('#FFFFFF', '#FFFFFF')}</g>`),
  // Splash: transparan (latar diatur di app.json), tunas emas
  'splash-icon.png': svg(`${defs('d')}
    <g transform="translate(512 512) scale(1.05) translate(-512 -552)">${sprout('url(#goldd)', '#6FC3BA')}</g>`),
};

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
for (const [name, markup] of Object.entries(variants)) {
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  await page.screenshot({ path: path.join(OUT, name), omitBackground: true, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  writeFileSync(path.join(OUT, name.replace('.png', '.svg')), markup); // sumber vektor
  console.log('✓', name);
}
// favicon 48px dari ikon
await page.setViewportSize({ width: 48, height: 48 });
await page.setContent(`<html><body style="margin:0"><div style="width:48px;height:48px;transform-origin:0 0;transform:scale(${48 / 1024})">${variants['icon.png']}</div></body></html>`);
await page.screenshot({ path: path.join(OUT, 'favicon.png'), clip: { x: 0, y: 0, width: 48, height: 48 } });
console.log('✓ favicon.png');
await browser.close();
