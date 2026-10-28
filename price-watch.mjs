// Stermont Arcade - price watch. Compares your prices with the competitor sites listed in price-watch.config.json, writes a Markdown report,
// and (when auto-apply is on) fixes the prices that are clearly out of line with the market.
// Runs from .github/workflows/price-watch.yml (no installs needed, Node 18+).
//
// What it changes, and the safety rails around it:
//   - CUTS a price that is clearly above market. Never below cost + minMarginPct, never more than maxCutPct in one run.
//   - RAISES a price that is clearly below market (when competitors are dearer, or have gone up). Never above the market price,
//     never more than maxRaisePct in one run. Needs no cost on file.
//   - Only acts on prices backed by at least minMatches matching listings. A wrong match is worse than no match, so matching is strict.
//   - At most maxChangesPerRun products per run (biggest gaps first), a backup CSV is written first, and a product whose price
//     was edited by hand while the check was running is skipped.
//   - Needs the SUPABASE_SERVICE_KEY secret. Without it the run is report-only.
//
// Keeping a run from hanging:
//   - All sites are searched AT THE SAME TIME for each product (each site is still asked one request at a time, with a pause,
//     so no single site is hit harder). Before this, 8 sites were asked one after another and a run could not finish in time.
//   - Every request has a timeout (requestTimeoutMs).
//   - A site that fails to load skipSourceAfter searches in a row is skipped for the rest of the run.
//   - The whole check stops after maxRunMinutes and still writes the report for the products it got through;
//     the list is rotated daily so the rest are covered on later runs.
//   - Progress is printed to the log (stderr) as it goes.
//
// Env: APPLY=1 (force apply) / APPLY=0 (force report-only), otherwise config "autoApply" decides.
//      SUPABASE_SERVICE_KEY, PRODUCTS_JSON (local test file), FIXTURE_DIR (local test pages), LIMIT (first N products)
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SB = process.env.SUPABASE_URL || 'https://oewvtbnmyombbtggamor.supabase.co';   // SUPABASE_URL only exists so the tests can point at a fake server
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public read key, same one stock-report.mjs uses

const DEFAULTS = {
  tolerancePct: 10,       // we are "clearly above market" when more than this % over the market price
  raiseGapPct: 10,        // we are "clearly below market" (room to raise) when this % or more under it
  minMarginPct: 10,       // never cut a price below cost + this %
  maxCutPct: 25,          // never cut a price by more than this % in one run
  maxRaisePct: 25,        // never raise a price by more than this % in one run
  roundTo: 10,            // cuts round UP and raises round DOWN to a multiple of this (KES); 1 = match the competitor price exactly
  useCost: true,          // false = ignore the cost column completely (no margin floor)
  maxMatches: 5,          // how many matching listings to keep per product (use a big number with marketBasis 'range')
  marketBasis: 'median',  // 'range' = one price per site (its cheapest), stay inside their range; 'lowest' = cheapest listing; 'median' = middle
  minMatches: 2,          // matching listings needed (all sites together) before a price is trusted enough to change
  maxChangesPerRun: 40,   // biggest gaps first; the rest wait for the next run
  autoApply: true,        // change prices automatically (still needs the SUPABASE_SERVICE_KEY secret)
  delayMs: 1200,          // pause between requests to the same site, to be polite to it
  requestTimeoutMs: 8000, // give up on a single request after this long (a slow site holds up every product, so keep this short)
  skipSourceAfter: 5,     // skip a site for the rest of the run after this many searches in a row that could not load
  maxRunMinutes: 45,      // stop checking products after this long and report on the ones done (the workflow limit is higher)
  sources: ['jumia', 'kilimall', 'agroduka', 'imaginecare'],
  urlOverrides: {},       // e.g. { "agroduka": "https://example.co.ke/search?q={q}" } if a site changes its search address
};
const cfgFile = new URL('./price-watch.config.json', import.meta.url);
export const CFG = { ...DEFAULTS, ...(existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, 'utf8')) : {}) };

/* ---------- text helpers ---------- */
const STOP = new Set(['the', 'and', 'for', 'with', 'of', 'in', 'a', 'an', 'set', 'new', 'original', 'genuine', 'free', 'delivery', 'kenya', 'by']);
const cp = n => { try { return String.fromCodePoint(n); } catch { return ''; } };
// Numeric entities are decoded first: WooCommerce prints "KSh" as &#75;&#83;&#104;, and those digits must never be read as a price.
export const decode = s => String(s || '').replace(/<[^>]*>/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => cp(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => cp(Number(d)))
  .replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function normalize(s) {
  return String(s || '').toLowerCase()
    .replace(/(\d+(?:\.\d+)?)\s*(?:litres?|liters?|ltrs?|l)\b/g, '$1l')
    .replace(/(\d+(?:\.\d+)?)\s*(?:millilitres?|milliliters?|ml)\b/g, '$1ml')
    .replace(/(\d+(?:\.\d+)?)\s*(?:kilograms?|kgs?)\b/g, '$1kg')
    .replace(/(\d+(?:\.\d+)?)\s*(?:grams?|gms?|g)\b/g, '$1g')
    .replace(/(\d+(?:\.\d+)?)\s*(?:pcs|pieces?|pc)\b/g, '$1pcs')
    .replace(/[^a-z0-9.]+/g, ' ').replace(/\.(?!\d)/g, ' ');
}
export const tokens = s => normalize(s).split(' ').filter(t => t && !STOP.has(t));

export function parseKsh(text) {
  // "KSh 2,499", "KSh 1,200 - KSh 1,500" (range: take the lowest), "Ksh2499.00"
  const nums = [...String(text || '').replace(/&#x?[0-9a-f]+;/gi, ' ').replace(/,/g, '').matchAll(/(\d+(?:\.\d+)?)/g)].map(m => Number(m[1])).filter(n => n > 0);
  return nums.length ? Math.min(...nums) : null;
}

// First money amount in already-decoded text: "KSh. 2,500", "KSh2,500", "KES 2500", "2,500 KSh". Returns { price, index } or null.
export function findPrice(text) {
  const t = String(text || '');
  const num = '([0-9][0-9,]*(?:\\.[0-9]+)?)';
  const hits = [
    t.match(new RegExp(`\\b(?:KShs?|KES)\\.?\\s*${num}`, 'i')),
    t.match(new RegExp(`${num}\\s*(?:KShs?|KES)\\b`, 'i')),
  ].filter(Boolean).sort((a, b) => a.index - b.index);
  if (!hits.length) return null;
  const price = Number(hits[0][1].replace(/,/g, ''));
  return price > 0 ? { price, index: hits[0].index } : null;
}

/* ---------- page parsers (pure functions, covered by price-watch.test.mjs) ---------- */
export function parseJumia(html) {
  const out = [];
  for (const m of String(html).matchAll(/<article[^>]*class="[^"]*\bprd\b[^"]*"[\s\S]*?<\/article>/g)) {
    const b = m[0];
    const name = decode((b.match(/<h3[^>]*class="[^"]*\bname\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/) || [])[1]);
    const price = parseKsh(decode((b.match(/<div[^>]*class="[^"]*\bprc\b[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1]));
    const href = (b.match(/<a[^>]*class="[^"]*\bcore\b[^"]*"[^>]*href="([^"]+)"/) || [])[1];
    if (name && price) out.push({ source: 'jumia', name, price, url: href ? new URL(href, 'https://www.jumia.co.ke').href : '' });
  }
  return out;
}

// Kilimall is a JavaScript-rendered site, so this reads any JSON embedded in the page (JSON-LD, state blobs) and picks out
// objects that look like a product with a price. If Kilimall changes its page, the report says so instead of failing quietly.
export function parseEmbeddedJson(html, source = 'kilimall') {
  const out = [], seen = new Set();
  const visit = (o, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 12) return;
    if (Array.isArray(o)) { o.forEach(x => visit(x, depth + 1)); return; }
    const name = o.name || o.title || o.goodsName || o.productName;
    const rawPrice = o.price ?? o.salePrice ?? o.minPrice ?? o.lowPrice ?? o.offers?.price ?? o.offers?.lowPrice ?? o.offers?.[0]?.price;
    const price = typeof rawPrice === 'number' ? rawPrice : parseKsh(rawPrice);
    if (typeof name === 'string' && name.length > 3 && price > 0) {
      const key = name + '|' + price;
      if (!seen.has(key)) { seen.add(key); out.push({ source, name: decode(name), price, url: typeof o.url === 'string' ? o.url : '' }); }
    }
    Object.values(o).forEach(v => visit(v, depth + 1));
  };
  for (const m of String(html).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    const body = m[1].trim();
    if (!body) continue;
    try { visit(JSON.parse(body)); continue; } catch { /* not plain JSON */ }
    const st = body.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);   // window.__STATE__ = {...}
    if (st) { try { visit(JSON.parse(st[1])); } catch { /* ignore */ } }
  }
  return out;
}

const absUrl = (href, base) => { try { return href ? new URL(href, base || 'https://example.invalid').href : ''; } catch { return ''; } };

// WooCommerce shop/search page (<li class="product ...">). Sale prices win over struck-through old prices; out-of-stock items are skipped.
export function parseWoo(html, source, base = '') {
  const out = [];
  for (const m of String(html).matchAll(/<li\b[^>]*class="[^"]*\bproduct\b[^"]*"[^>]*>[\s\S]*?<\/li>/gi)) {
    const b = m[0];
    if (/\boutofstock\b|out of stock/i.test(b)) continue;
    const t = (b.match(/<h[2-4][^>]*class="[^"]*(?:woocommerce-loop-product__title|product-title|product_title)[^"]*"[^>]*>([\s\S]*?)<\/h[2-4]>/i)
      || b.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i) || [])[1];
    const name = decode(t);
    const fp = findPrice(decode(b.replace(/<del[\s\S]*?<\/del>/gi, ' ')));
    if (name && fp) out.push({ source, name, price: fp.price, url: absUrl((b.match(/<a[^>]*href="([^"]+)"/) || [])[1], base) });
  }
  return out;
}

// WooCommerce Store API: /wp-json/wc/store/v1/products?search=... Prices come in minor units ("285000" with 2 decimals = 2850).
// Returns null when the text is not that kind of JSON, so the caller can fall back to the normal page.
export function parseWooStore(text, source) {
  let arr;
  try { arr = JSON.parse(text); } catch { return null; }
  if (!Array.isArray(arr)) return null;
  const out = [];
  for (const p of arr) {
    if (!p || p.is_in_stock === false) continue;
    const minor = Number(p.prices?.currency_minor_unit ?? 2);
    const price = Number(p.prices?.price) / 10 ** (Number.isFinite(minor) ? minor : 2);
    const name = decode(p.name);
    if (name && price > 0) out.push({ source, name, price, url: typeof p.permalink === 'string' ? p.permalink : '' });
  }
  return out;
}

// Fallback for ordinary server-rendered shops (CS-Cart, X-Cart, custom themes): a product link followed by a "KSh" amount before the
// next product link. Looser than the others, so it relies on the strict matching below to throw away anything that is not a real match.
const NOISE = /^(add to cart|read more|quick view|buy now|view details?|details|select options|compare|add to wishlist|wishlist|login|register|my account|cart|view cart|checkout|home|shop|sale!?|new|out of stock|in stock|whatsapp agroduka)$/i;
const productish = t => t.length >= 3 && t.length <= 180 && /[a-z]{3}/i.test(t) && !NOISE.test(t);
export function parseGeneric(html, source, base = '') {
  const s = String(html), anchors = [];
  for (const m of s.matchAll(/<a\b[^>]*?href\s*=\s*"([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const title = (m[0].match(/\btitle\s*=\s*"([^"]+)"/i) || [])[1];
    anchors.push({ href: m[1], text: decode(m[2]) || decode(title), start: m.index, end: m.index + m[0].length });
  }
  const out = [], seen = new Set();
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    let name = a.text, fp = findPrice(a.text), after = '';
    if (fp) name = a.text.slice(0, fp.index).trim();        // the whole product card is one link
    else {
      let stop = Math.min(s.length, a.end + 900);
      for (let j = i + 1; j < anchors.length; j++) if (productish(anchors[j].text)) { stop = Math.min(stop, anchors[j].start); break; }
      after = decode(s.slice(a.end, stop));
      fp = findPrice(after);
    }
    if (!fp || !productish(name) || /out of stock/i.test(after)) continue;
    const key = name + '|' + fp.price;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ source, name, price: fp.price, url: absUrl(a.href, base) });
  }
  return out;
}

// One page of results from any site, whichever way it was built: WooCommerce first, then embedded JSON, then plain links.
export function parsePage(html, source, base = '') {
  for (const f of [() => parseWoo(html, source, base), () => parseEmbeddedJson(html, source), () => parseGeneric(html, source, base)]) {
    const r = f();
    if (r.length) return r;
  }
  return [];
}

const enc = encodeURIComponent;
const SOURCES = {
  jumia: { label: 'Jumia', tries: [{ kind: 'html', url: q => `https://www.jumia.co.ke/catalog/?q=${enc(q)}`, parse: parseJumia }] },
  kilimall: { label: 'Kilimall', tries: [{ kind: 'html', url: q => `https://www.kilimall.co.ke/search?q=${enc(q)}`, parse: h => parseEmbeddedJson(h, 'kilimall') }] },
  // Agroduka runs on two storefronts (agroduka.ke and agroduka.com). The first one that returns readable listings is used for the whole run.
  agroduka: {
    label: 'Agroduka', tries: [
      { kind: 'html', url: q => `https://agroduka.ke/index.php?subcats=Y&pcode_from_q=Y&pshort=Y&pfull=Y&pname=Y&pkeywords=Y&search_performed=Y&q=${enc(q)}&dispatch=products.search`, parse: h => parsePage(h, 'agroduka', 'https://agroduka.ke') },
      { kind: 'html', url: q => `https://agroduka.com/?target=search&mode=search&substring=${enc(q)}&including=all`, parse: h => parsePage(h, 'agroduka', 'https://agroduka.com') },
    ],
  },
  // ImagineCare is a WordPress/WooCommerce shop: try the JSON Store API first, then the normal search page.
  imaginecare: {
    label: 'ImagineCare', tries: [
      { kind: 'json', url: q => `https://imaginecare.co.ke/wp-json/wc/store/v1/products?search=${enc(q)}&per_page=20`, parse: t => parseWooStore(t, 'imaginecare') },
      { kind: 'html', url: q => `https://imaginecare.co.ke/?s=${enc(q)}&post_type=product`, parse: h => parsePage(h, 'imaginecare', 'https://imaginecare.co.ke') },
    ],
  },
};
const sourceLabel = s => SOURCES[s]?.label || s;
function triesFor(src) {
  const tpl = CFG.urlOverrides?.[src];
  if (tpl) { const origin = new URL(tpl.replace('{q}', 'x')).origin; return [{ kind: 'html', url: q => tpl.replace('{q}', enc(q)), parse: h => parsePage(h, src, origin) }]; }
  return SOURCES[src].tries;
}

/* ---------- matching and pricing (pure functions) ---------- */
// A listing counts as the same product only when every size/number in our name appears in the title (16L, 500ml, 12ch...)
// and at least 75% of our other words do. Wrong matches are worse than no match, so this is strict.
export function matchScore(product, listing) {
  const mine = [...new Set(tokens(`${product.name} ${product.variant_label || ''}`))];
  const theirs = new Set(tokens(listing.name));
  if (!mine.length) return 0;
  const sizes = mine.filter(t => /\d/.test(t));
  if (sizes.some(t => !theirs.has(t))) return 0;
  return mine.filter(t => theirs.has(t)).length / mine.length;
}

export function median(a) { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
const roundUp = (n, step) => Math.ceil(n / step - 1e-9) * step;
const roundDown = (n, step) => Math.floor(n / step + 1e-9) * step;

export function pickMatches(product, listings, cfg = CFG) {
  const ours = Number(product.price);
  return listings
    .filter(l => l.price >= ours * 0.4 && l.price <= ours * 3)        // ignore accessories and bundles far from our price
    .map(l => ({ ...l, score: matchScore(product, l) }))
    .filter(l => l.score >= 0.75)
    .sort((a, b) => b.score - a.score || a.price - b.price)
    .slice(0, cfg.maxMatches || 5);
}

// marketBasis 'range': every site counts once, at its own cheapest matching listing (on Jumia that is the cheapest seller).
// One site = match its price exactly. Several sites with different prices = our price must sit inside their range;
// above the range comes down to its top, below the range goes up to its bottom, inside the range is left alone.
// useCost:false means the cost column is ignored (no margin floor).
export function assess(product, matches, cfg = CFG) {
  const ours = Number(product.price), cost = Number(product.cost) || 0, useCost = cfg.useCost !== false;
  if (!matches.length) return { status: 'nomatch' };
  const trusted = matches.length >= cfg.minMatches;
  let low, high;
  if (cfg.marketBasis === 'range') {
    const per = {};
    for (const m of matches) if (!(m.source in per) || m.price < per[m.source]) per[m.source] = m.price;
    const ps = Object.values(per);
    low = Math.min(...ps); high = Math.max(...ps);
  } else {
    low = high = cfg.marketBasis === 'lowest' ? Math.min(...matches.map(m => m.price)) : median(matches.map(m => m.price));
  }
  const market = ours > high ? high : low;
  const gapPct = (ours > high ? ours / high - 1 : ours < low ? ours / low - 1 : 0) * 100;
  const base = { market, low, high, matches, trusted, gapPct: ours > high || ours < low ? gapPct : (ours / market - 1) * 100 };
  if (ours > high * (1 + cfg.tolerancePct / 100)) {
    const floor = useCost && cost > 0 ? cost * (1 + cfg.minMarginPct / 100) : 0;
    const target = Math.max(roundUp(high, cfg.roundTo), floor ? roundUp(floor, cfg.roundTo) : 0, roundUp(ours * (1 - cfg.maxCutPct / 100), cfg.roundTo));
    if (useCost && !cost) return { ...base, status: 'above', blocked: 'no cost on file, so the margin floor cannot be checked' };
    if (target >= ours) return { ...base, status: 'above', blocked: 'already at the minimum margin' };
    const capped = target > roundUp(high, cfg.roundTo);
    return { ...base, status: 'above', direction: 'cut', target, marginPct: cost > 0 ? (target / cost - 1) * 100 : null, note: capped ? (floor && target === roundUp(floor, cfg.roundTo) ? 'held at minimum margin' : `cut limited to ${cfg.maxCutPct}%`) : '' };
  }
  if (ours < low * (1 - cfg.raiseGapPct / 100)) {
    // follow the market up: to the lowest competitor price at most (never above it), and by no more than maxRaisePct in one run
    const ceiling = roundDown(low, cfg.roundTo), step = roundDown(ours * (1 + cfg.maxRaisePct / 100), cfg.roundTo);
    const target = Math.min(ceiling, step);
    if (target <= ours) return { ...base, status: 'below', blocked: 'too close to the market price to move a whole step' };
    return { ...base, status: 'below', direction: 'raise', target, marginPct: cost > 0 ? (target / cost - 1) * 100 : null, note: step < ceiling ? `raise limited to ${cfg.maxRaisePct}%` : '' };
  }
  return { ...base, status: 'ok' };
}

/* ---------- I/O ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const progress = m => console.error(`[${new Date().toISOString().slice(11, 19)}] ${m}`);   // stderr, so it shows in the Actions log and stays out of the report
async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const all = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,name,price,cost,old_price,variant_label,unit&order=name.asc&limit=1000&offset=${from}`, { headers: { apikey: KEY }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`Could not read products from Supabase (${r.status})`);
    const page = await r.json(); all.push(...page);
    if (page.length < 1000) break;
  }
  return all;
}

const health = {};    // per source: searches asked, searches that loaded, searches that gave readable listings
const proven = {};    // per source: which address/parser worked, so the others are not tried again this run
async function load(src, t, query) {
  if (process.env.FIXTURE_DIR) {
    const f = `${process.env.FIXTURE_DIR}/${src}.${t.kind === 'json' ? 'json' : 'html'}`;
    if (!existsSync(f)) throw new Error('no fixture');
    return readFileSync(f, 'utf8');
  }
  // the timeout covers reading the body too, so a site that sends headers and then stalls cannot hang the run
  const r = await fetch(t.url(query), { headers: { 'user-agent': 'Mozilla/5.0 (compatible; StermontPriceWatch/1.0; +https://stermontarcade.co.ke)', 'accept-language': 'en-KE,en;q=0.9' }, signal: AbortSignal.timeout(CFG.requestTimeoutMs) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function search(src, query) {
  const h = (health[src] ||= { asked: 0, loaded: 0, readable: 0, lastError: '', streak: 0, gaveUp: false });
  if (h.gaveUp) return [];
  h.asked++;
  const tries = triesFor(src);
  let loaded = false, found = [];
  for (const i of proven[src] != null ? [proven[src]] : tries.map((_, k) => k)) {
    try {
      const res = tries[i].parse(await load(src, tries[i], query));
      if (res === null) throw new Error('not the expected kind of page');
      loaded = true;
      if (res.length) { found = res; proven[src] = i; }
    } catch (e) { h.lastError = String(e.message || e); }
    if (!process.env.FIXTURE_DIR) await sleep(CFG.delayMs);
    if (found.length) break;
  }
  if (loaded) { h.loaded++; h.streak = 0; }
  else if (++h.streak >= CFG.skipSourceAfter) { h.gaveUp = true; progress(`${sourceLabel(src)} failed ${h.streak} searches in a row (${h.lastError}); skipping it for the rest of this run`); }
  if (found.length) h.readable++;
  return found;
}

const queryFor = p => tokens(p.name).slice(0, 7).join(' ');
const kes = n => 'KSh ' + Math.round(n).toLocaleString('en-KE');
const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

async function main() {
  let products = (await getProducts()).filter(p => p && p.id && p.name && Number(p.price) > 0);
  if (process.env.LIMIT) products = products.slice(0, Number(process.env.LIMIT));
  else if (process.env.GITHUB_ACTIONS && products.length > 1) {
    // start somewhere different each day, so if a run runs out of time the same products are not always the ones left unchecked
    const day = Math.floor(Date.now() / 86400000), start = (day * 60) % products.length;
    products = [...products.slice(start), ...products.slice(0, start)];
  }
  const deadline = Date.now() + CFG.maxRunMinutes * 60000;
  let timedOut = false;
  progress(`Checking ${products.length} products on ${CFG.sources.length} sites (time limit ${CFG.maxRunMinutes} min)`);
  const results = [];
  for (const [i, p] of products.entries()) {
    if (Date.now() > deadline) { timedOut = true; progress(`Time limit reached after ${i} of ${products.length} products; writing the report`); break; }
    const q = queryFor(p);
    // every site is searched at the same time; the results keep the order of CFG.sources
    const listings = (await Promise.all(CFG.sources.map(s => search(s, q)))).flat();
    results.push({ p, ...assess(p, pickMatches(p, listings, CFG)) });
    if ((i + 1) % 10 === 0) progress(`${i + 1} of ${products.length} products checked`);
  }
  const checked = results.length;

  const by = s => results.filter(r => r.status === s);
  const above = by('above'), below = by('below'), ok = by('ok'), nomatch = by('nomatch');
  const actionable = results.filter(r => r.target && r.trusted).sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct));
  const batch = actionable.slice(0, CFG.maxChangesPerRun), deferred = actionable.length - batch.length;
  const label = p => p.name + (p.variant_label ? ` · ${p.variant_label}` : '');
  const links = r => r.matches.map(m => `[${sourceLabel(m.source)} ${kes(m.price)}](${m.url || '#'})`).join(', ');
  const margin = r => r.marginPct == null ? '-' : r.marginPct.toFixed(0) + '%';
  const untrusted = r => r.target && !r.trusted ? ' (only 1 listing, not auto-applied)' : '';

  const broken = CFG.sources.filter(s => health[s] && (health[s].readable === 0 || health[s].gaveUp));
  let md = `# Price watch ${new Date().toISOString().slice(0, 10)}\n\n`;
  md += `Checked **${checked}** active items against ${CFG.sources.map(sourceLabel).join(', ')}. `;
  md += `**${above.length}** clearly above market, **${below.length}** clearly under market, **${ok.length}** in line, **${nomatch.length}** with no confident match.\n`;
  if (timedOut) md += `\n> ⏱️ Stopped after ${CFG.maxRunMinutes} minutes with **${products.length - checked}** items not yet checked. They are covered on later runs (the starting point moves every day).\n`;
  for (const s of broken) md += `\n> ⚠️ **${sourceLabel(s)} returned no readable listings** (${health[s].loaded}/${health[s].asked} pages loaded${health[s].lastError ? `, last error: ${health[s].lastError}` : ''}).${health[s].gaveUp ? ' It was skipped for the rest of the run after repeated failures.' : ''} The site may be blocking the check or has changed its page, so its prices were not used this run. If its search address changed, set it under "urlOverrides" in price-watch.config.json.\n`;

  if (above.length) {
    md += `\n### Above market (${above.length})\nSuggested price matches the ${CFG.marketBasis === 'median' ? 'market median' : CFG.marketBasis === 'range' ? 'top of what the sites charge (each site at its cheapest seller)' : 'lowest matching price'}${CFG.useCost === false ? '' : `, never below cost + ${CFG.minMarginPct}%`}.\n\n| Item | Now | Market | Over | Suggested | New margin | Seen at |\n|---|---|---|---|---|---|---|\n`;
    for (const r of above.sort((a, b) => b.gapPct - a.gapPct).slice(0, 60))
      md += `| ${label(r.p)} | ${kes(r.p.price)} | ${kes(r.market)} | +${r.gapPct.toFixed(0)}% | ${r.target ? kes(r.target) + (r.note ? ` (${r.note})` : '') : `no change: ${r.blocked}`}${untrusted(r)} | ${r.target ? margin(r) : '-'} | ${links(r)} |\n`;
    if (above.length > 60) md += `\n…and ${above.length - 60} more in the CSV.\n`;
  }
  if (below.length) {
    md += `\n### Under market (${below.length})\nPrices follow the market up, never above the market price, and raises are capped at ${CFG.maxRaisePct}% per run.\n\n| Item | Now | Market | Under | Suggested | Margin then | Seen at |\n|---|---|---|---|---|---|---|\n`;
    for (const r of below.sort((a, b) => a.gapPct - b.gapPct).slice(0, 60))
      md += `| ${label(r.p)} | ${kes(r.p.price)} | ${kes(r.market)} | ${r.gapPct.toFixed(0)}% | ${r.target ? kes(r.target) + (r.note ? ` (${r.note})` : '') : `no change: ${r.blocked}`}${untrusted(r)} | ${r.target ? margin(r) : '-'} | ${links(r)} |\n`;
    if (below.length > 60) md += `\n…and ${below.length - 60} more in the CSV.\n`;
  }
  md += `\n_${nomatch.length} items had no confident match (specialist or locally sourced products are common here). Matching is strict on sizes and model names, so a missing match is safer than a wrong one._\n`;

  /* apply step */
  const applyMode = process.env.APPLY === '1' ? true : process.env.APPLY === '0' ? false : !!CFG.autoApply;
  if (applyMode && actionable.length) {
    const svc = process.env.SUPABASE_SERVICE_KEY;
    let note = '';
    if (!svc) note = 'Auto-apply is on but the SUPABASE_SERVICE_KEY secret is not set, so nothing was changed. Add it under Settings → Secrets and variables → Actions.';
    else {
      writeFileSync('price-watch-backup.csv', 'id,name,previous_price,new_price,previous_old_price\n' + batch.map(r => [r.p.id, r.p.name, r.p.price, r.target, r.p.old_price ?? ''].map(csvCell).join(',')).join('\n') + '\n');
      const lines = [];
      for (const r of batch) {
        const body = { price: r.target };
        if (r.p.old_price != null && Number(r.p.old_price) <= r.target) body.old_price = null;   // no "was" price below the new price
        // the price=eq filter makes sure nobody edited this price by hand while the check was running
        let res;
        try {
          res = await fetch(`${SB}/rest/v1/products?id=eq.${encodeURIComponent(r.p.id)}&price=eq.${encodeURIComponent(r.p.price)}`, { method: 'PATCH', headers: { apikey: svc, authorization: `Bearer ${svc}`, 'content-type': 'application/json', prefer: 'return=representation' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
        } catch (e) {
          lines.push(`- could not update **${label(r.p)}** (${String(e.message || e)})`);
          continue;
        }
        let rows = [];
        if (res.ok) { try { rows = await res.json(); } catch { rows = []; } }
        if (res.ok && rows.length) { r.applied = true; lines.push(`- ${r.direction === 'cut' ? '⬇️ cut' : '⬆️ raised'} **${label(r.p)}**: ${kes(r.p.price)} → ${kes(r.target)} (market ${kes(r.market)}${r.note ? `, ${r.note}` : ''})`); }
        else if (res.ok) lines.push(`- skipped **${label(r.p)}**: its price changed while the check was running`);
        else lines.push(`- could not update **${label(r.p)}** (HTTP ${res.status})`);
      }
      const n = batch.filter(r => r.applied).length;
      note = `Changed **${n}** price${n === 1 ? '' : 's'}. Previous prices are in the price-watch-backup.csv file attached to this run.\n\n${lines.join('\n')}`;
      if (deferred) note += `\n\n${deferred} more ${deferred === 1 ? 'change is' : 'changes are'} waiting for the next run (limit ${CFG.maxChangesPerRun} per run).`;
    }
    md += `\n### Prices changed\n${note}\n`;
  } else if (!applyMode && actionable.length) {
    md += `\n**${actionable.length} trusted change${actionable.length === 1 ? '' : 's'} were not applied** because this run was report-only. Auto-apply is ${CFG.autoApply ? 'on, so the next scheduled run will apply them' : 'off: set "autoApply": true in price-watch.config.json'}.\n`;
  }

  writeFileSync('price-watch.csv', 'id,name,status,our_price,cost,market_median,gap_pct,suggested,applied,matches\n' + results.map(r => [r.p.id, label(r.p), r.status, r.p.price, r.p.cost ?? '', r.market ? Math.round(r.market) : '', r.gapPct != null ? r.gapPct.toFixed(1) : '', r.target ?? '', r.applied ? 'yes' : '', (r.matches || []).map(m => `${m.source}:${m.price}:${m.name}`).join(' | ')].map(csvCell).join(',')).join('\n') + '\n');
  console.log(md);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `items=${above.length + below.length + broken.length + (timedOut ? 1 : 0)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await main();
