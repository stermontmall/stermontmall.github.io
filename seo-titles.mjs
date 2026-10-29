// Stermont Arcade - modern product titles + meta descriptions + Kenya search-terms box (Task D).
// Runs from seo-overrides.mjs AFTER seo-kenya.mjs, so it replaces the plain "Buy <product> in Kenya | KSh X" title.
// Hand-written entries in seo-overrides.json still win (they are applied after this file, and are skipped here).
// To switch it off: delete the seo-titles line in seo-overrides.mjs (or revert the Task D commits).
// Rules: no invented facts. Only the product name, price, stock, M-Pesa, WhatsApp and 47-county delivery (all already on the site).
// Safe by design: every page is wrapped in try/catch, a bad page is skipped, the script never exits with an error.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const ksh = n => 'KSh ' + Number(n).toLocaleString('en-US');
const YEAR = new Date().getFullYear();

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

// ---- Kenyan search-term bank (40 terms). All are true for this shop: nothing here promises speed, free delivery or a guarantee. ----
// Used in 3 places: the description closing line, the "People also search" line and the delivery line on each product page.
const TERM_BANK = [
  // buyer intent (English)
  'price in Kenya', 'buy online Kenya', 'order online Kenya', 'shop online Kenya', 'online shop Nairobi', 'best price Kenya',
  'affordable in Kenya', 'cheap in Kenya', `latest price in Kenya ${YEAR}`, 'where to buy in Kenya', 'near me Nairobi', 'in stock Nairobi',
  // Swahili / Sheng-friendly
  'bei nafuu', 'bei gani', 'nunua online', 'duka online Kenya', 'lipa kwa M-Pesa', 'agiza online',
  // payment and ordering
  'pay by M-Pesa', 'M-Pesa payment', 'buy now pay by M-Pesa', 'order on WhatsApp', 'WhatsApp order Kenya', 'KSh price',
  // trust words (the shop confirms these are true for its stock)
  'original', 'genuine', 'top quality',
  // places we deliver to (all 47 counties are served)
  'delivery Nairobi', 'Nairobi delivery', 'Mombasa delivery', 'Kisumu delivery', 'Nakuru delivery', 'Eldoret delivery',
  'Thika delivery', 'Nyeri delivery', 'Kisii delivery', 'Meru delivery', 'Machakos delivery', 'countrywide delivery',
  // local anchors
  'Westlands Nairobi', 'The Sarit Centre'
];
// product-specific search phrases (name + one of these)
const SUFFIXES = ['price in Kenya', 'bei nafuu', 'buy online Kenya', 'order on WhatsApp', `price KSh ${YEAR}`, 'delivery Nairobi',
  'lipa kwa M-Pesa', 'best price Kenya', 'original Kenya', 'near me Nairobi', 'Mombasa delivery', 'where to buy'];
const CITIES = 'Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika, Nyeri, Kisii, Meru, Machakos, Kiambu';

const pick = (arr, key, n) => { const s = hash(key) % arr.length, out = []; for (let i = 0; i < n; i++) out.push(arr[(s + i * 5) % arr.length]); return [...new Set(out)]; };

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

const TAILS_IN = [
  'Order online, pay by M-Pesa, delivery to all 47 counties.',
  'Shop online in Nairobi, lipa kwa M-Pesa, countrywide delivery.',
  'Nunua online, pay by M-Pesa, delivery to all 47 counties.',
  'Order on WhatsApp, pay by M-Pesa, delivery to all 47 counties.'
];
function makeDesc(name, price, inStock, key) {
  const tail = inStock ? TAILS_IN[hash(key) % TAILS_IN.length] : 'Ask us on WhatsApp when it is back. Pay by M-Pesa.';
  const full = n => `Original ${n} price in Kenya: ${price}. Top quality, bei nafuu. ${tail}`;
  const mid = n => `Original ${n} price in Kenya: ${price}. ${tail}`;
  if (full(name).length <= MAX_DESC) return full(name);
  if (mid(name).length <= MAX_DESC) return mid(name);
  const room = MAX_DESC - mid('').length;
  return mid(clip(name, Math.max(room, 20)));
}

// Visible box at the bottom of the product page: real delivery places + real search phrases. Not hidden text.
function makeBox(name, key) {
  const phrases = pick(SUFFIXES, key, 6).map(s => `${name} ${s}`);
  const extra = pick(TERM_BANK, key + 'x', 4);
  return `<div class="box kenya-terms"><p><b>Delivery across Kenya:</b> ${esc(CITIES)} and all 47 counties. Pay by M-Pesa.</p><p><b>People also search:</b> ${[...phrases, ...extra].map(esc).join(' · ')}</p></div>\n`;
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
    const title = esc(makeTitle(name, price, id)), desc = esc(makeDesc(name, price, inStock, id));
    const before = h;
    h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${desc}">`)
      .replace(/(<meta property="og:title" content=")[^"]*(">)/, (m, a, b) => a + title + b)
      .replace(/(<meta property="og:description" content=")[^"]*(">)/, (m, a, b) => a + desc + b)
      .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (m, a, b) => a + title + b)
      .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, (m, a, b) => a + desc + b);
    // terms box: remove an old one (re-runs stay clean), then add before </main> (or </body>)
    h = h.replace(/<div class="box kenya-terms">[\s\S]*?<\/div>\n?/, '');
    const box = makeBox(name, id);
    if (h.includes('</main>')) h = h.replace('</main>', () => box + '</main>');
    else if (h.includes('</body>')) h = h.replace('</body>', () => box + '</body>');
    if (h !== before) { writeFileSync(file, h); done++; }
  } catch (e) { console.log('skip product page', f, e.message); }
}
console.log(`Modern titles, descriptions and Kenya terms set on ${done} product page(s); ${skipped} left to hand-written overrides. Term bank: ${TERM_BANK.length} terms.`);
