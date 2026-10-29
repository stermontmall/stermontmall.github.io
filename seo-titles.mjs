// Stermont Arcade - modern product titles + meta descriptions (Task D).
// Runs from seo-overrides.mjs AFTER seo-kenya.mjs, so it replaces the plain "Buy <product> in Kenya | KSh X" title.
// Hand-written entries in seo-overrides.json still win (they are applied after this file, and are skipped here).
// To switch it off: delete the seo-titles line in seo-overrides.mjs (or revert the Task D commit).
// Rules: no invented facts. Only the product name, price, stock, M-Pesa and 47-county delivery (all already on the site).
// Safe by design: every page is wrapped in try/catch, a bad page is skipped, the script never exits with an error.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const ksh = n => 'KSh ' + Number(n).toLocaleString('en-US');

let overrides = {};
try { overrides = JSON.parse(readFileSync('seo-overrides.json', 'utf8')); } catch { /* no overrides file: fine */ }

const MAX_TITLE = 68, MAX_DESC = 158;
// [prefix, suffix]. Three looks so the whole shop does not read like one template. {p} = price.
const TITLES = [
  ['', ' Price in Kenya | {p}'],
  ['Original ', ' | {p}, Pay by M-Pesa'],
  ['', ' in Kenya: {p} | Order Online']
];
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function makeTitle(name, price, key) {
  const parts = TITLES.map(([pre, suf]) => ({ pre, suf: suf.replace('{p}', price) }));
  const first = hash(key) % parts.length;
  // try the variant picked for this product, then the others; use the first one where the full name fits (no cut-off name)
  for (let i = 0; i < parts.length; i++) {
    const v = parts[(first + i) % parts.length];
    if ((v.pre + name + v.suf).length <= MAX_TITLE) return v.pre + name + v.suf;
  }
  const v = parts[0]; // nothing fits: shortest wording, clip the name
  return v.pre + clip(name, MAX_TITLE - v.pre.length - v.suf.length) + v.suf;
}

function makeDesc(name, price, inStock) {
  const tail = inStock
    ? 'Order online, pay by M-Pesa, delivery to all 47 counties.'
    : 'Ask us on WhatsApp when it is back. Pay by M-Pesa.';
  const full = n => `Original ${n} price in Kenya: ${price}. Top quality, bei nafuu. ${tail}`;
  const mid = n => `Original ${n} price in Kenya: ${price}. ${tail}`;
  if (full(name).length <= MAX_DESC) return full(name);
  if (mid(name).length <= MAX_DESC) return mid(name);
  const room = MAX_DESC - mid('').length;
  return mid(clip(name, Math.max(room, 20)));
}

let done = 0, skipped = 0;
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const id = f.replace(/\.html$/, '');
    if (overrides[id]) { skipped++; continue; }           // hand-written title wins
    const file = `p/${f}`;
    let h = readFileSync(file, 'utf8');
    const pm = h.match(/product:price:amount" content="(\d+)"/), nm = h.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!pm || !nm) continue;                             // redirect stubs, hidden items
    const name = unesc(nm[1].replace(/<[^>]+>/g, '').trim());
    if (!name) continue;
    const price = ksh(pm[1]);
    const inStock = /product:availability" content="in stock"/.test(h);
    const title = esc(makeTitle(name, price, id)), desc = esc(makeDesc(name, price, inStock));
    const before = h;
    h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${desc}">`)
      .replace(/(<meta property="og:title" content=")[^"]*(">)/, (m, a, b) => a + title + b)
      .replace(/(<meta property="og:description" content=")[^"]*(">)/, (m, a, b) => a + desc + b)
      .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (m, a, b) => a + title + b)
      .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, (m, a, b) => a + desc + b);
    if (h !== before) { writeFileSync(file, h); done++; }
  } catch (e) { console.log('skip product page', f, e.message); }
}
console.log(`Modern titles and descriptions set on ${done} product page(s); ${skipped} left to hand-written overrides.`);
