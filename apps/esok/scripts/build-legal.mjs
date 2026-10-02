/**
 * Membangun dokumen hukum dari docs/legal/*.md:
 *  - src/content/legal.generated.json  → layar dalam aplikasi
 *  - ../../site/*.html                 → halaman web publik (untuk URL kebijakan privasi di toko aplikasi)
 * `--strict` gagal bila operatorName/contactEmail belum diisi di docs/legal/config.json (wajib sebelum rilis toko).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, '../../docs/legal');
const site = join(root, '../../site');
const strict = process.argv.includes('--strict');
const cfg = JSON.parse(readFileSync(join(docs, 'config.json'), 'utf8'));

const missing = ['operatorName', 'contactEmail'].filter((k) => !String(cfg[k] ?? '').trim());
if (missing.length) {
  const msg = `docs/legal/config.json belum diisi: ${missing.join(', ')}`;
  if (strict) {
    console.error(`GAGAL (--strict): ${msg}`);
    process.exit(1);
  }
  console.warn(`PERINGATAN: ${msg} — placeholder akan tampil di dokumen.`);
}
const fill = (lang, s) =>
  s
    .replaceAll('{{EFFECTIVE_DATE}}', cfg.effectiveDate)
    .replaceAll('{{OPERATOR}}', cfg.operatorName || (lang === 'id' ? '[nama pengelola — isi sebelum rilis]' : '[operator name — set before release]'))
    .replaceAll('{{CONTACT}}', cfg.contactEmail || (lang === 'id' ? '[email kontak — isi sebelum rilis]' : '[contact email — set before release]'));

function parse(md) {
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ t: 'p', text: para.join(' ') });
    para = [];
  };
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) flush();
    else if (line.startsWith('# ')) (flush(), blocks.push({ t: 'h1', text: line.slice(2) }));
    else if (line.startsWith('## ')) (flush(), blocks.push({ t: 'h2', text: line.slice(3) }));
    else if (line.startsWith('> ')) (flush(), blocks.push({ t: 'q', text: line.slice(2) }));
    else if (line.startsWith('- ')) (flush(), blocks.push({ t: 'li', text: line.slice(2) }));
    else para.push(line.trim());
  }
  flush();
  return blocks;
}

const docNames = ['privacy', 'terms'];
const langs = ['en', 'id'];
const out = {};
for (const lang of langs) {
  out[lang] = {};
  for (const d of docNames) {
    const blocks = parse(fill(lang, readFileSync(join(docs, `${d}.${lang}.md`), 'utf8')));
    out[lang][d] = { title: blocks.find((b) => b.t === 'h1').text, blocks: blocks.filter((b) => b.t !== 'h1') };
  }
}
out.meta = { effectiveDate: cfg.effectiveDate, donateUrl: cfg.donateUrl || '' };
writeFileSync(join(root, 'src/content/legal.generated.json'), JSON.stringify(out));

// ---- HTML ----
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
function html(blocks) {
  let h = '';
  let inList = false;
  for (const b of blocks) {
    if (b.t !== 'li' && inList) ((h += '</ul>\n'), (inList = false));
    if (b.t === 'li') {
      if (!inList) ((h += '<ul>\n'), (inList = true));
      h += `<li>${inline(b.text)}</li>\n`;
    } else if (b.t === 'h2') h += `<h2>${inline(b.text)}</h2>\n`;
    else if (b.t === 'q') h += `<p class="note">${inline(b.text)}</p>\n`;
    else h += `<p>${inline(b.text)}</p>\n`;
  }
  if (inList) h += '</ul>\n';
  return h;
}
const css = `:root{--bg:#f7f4ec;--fg:#14302f;--muted:#5c706f;--card:#fff;--accent:#0f5c5a;--border:#e3ddcb}
@media(prefers-color-scheme:dark){:root{--bg:#0c1b1b;--fg:#eaf1ee;--muted:#9db3b0;--card:#142828;--accent:#5fc2b8;--border:#223838}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 64px}h1{font-size:28px;line-height:1.25}h2{font-size:19px;margin-top:28px}
a{color:var(--accent)}.note{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 14px;color:var(--muted)}
nav{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:8px}.lang{display:flex;gap:10px;margin:8px 0 24px}
section{scroll-margin-top:16px}hr{border:0;border-top:1px solid var(--border);margin:48px 0}`;
const page = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — ${esc(cfg.appName)}</title><meta name="robots" content="index,follow"><style>${css}</style></head>
<body><main><nav><a href="./">${esc(cfg.appName)}</a><a href="privacy.html">Privacy Policy / Kebijakan Privasi</a><a href="terms.html">Terms / Syarat &amp; Ketentuan</a></nav>
${body}</main></body></html>
`;
mkdirSync(site, { recursive: true });
for (const d of docNames) {
  const body = `<div class="lang"><a href="#en">English</a><a href="#id">Bahasa Indonesia</a></div>
<section id="en" lang="en"><h1>${esc(out.en[d].title)}</h1>\n${html(out.en[d].blocks)}</section><hr>
<section id="id" lang="id"><h1>${esc(out.id[d].title)}</h1>\n${html(out.id[d].blocks)}</section>`;
  writeFileSync(join(site, `${d}.html`), page(out.en[d].title, body));
}
writeFileSync(
  join(site, 'index.html'),
  page(
    cfg.appName,
    `<h1>${esc(cfg.appName)} — Daily Islamic Reminder</h1>
<p>Remember death, fill today with good. Prayer times, qibla, Qur'an, dhikr, a deeds journal and groups — free, ad-free, and private by design. Secret deeds are end-to-end encrypted.</p>
<p><a href="privacy.html">Privacy Policy / Kebijakan Privasi</a> · <a href="terms.html">Terms of Service / Syarat &amp; Ketentuan</a></p>`,
  ),
);
console.log(`legal: ${langs.length} bahasa × ${docNames.length} dokumen → src/content/legal.generated.json, site/*.html`);
