// Stermont Arcade - weekly price watch. Compares your prices with Jumia and Kilimall and writes a Markdown report.
// Runs from .github/workflows/price-watch.yml (no installs needed, Node 18+).
//
// Default mode is READ-ONLY: it only reports. Prices change only when the workflow is started by hand with "apply" ticked
// AND the SUPABASE_SERVICE_KEY secret is set. Even then it only LOWERS prices that are clearly above market, never below
// your minimum margin, never by more than maxCutPct in one run, and it writes a backup CSV first.
//
// Env: APPLY=1, SUPABASE_SERVICE_KEY, PRODUCTS_JSON (local test file), FIXTURE_DIR (local test pages), LIMIT (first N products)
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public read key, same one stock-report.mjs uses

const DEFAULTS = {
  tolerancePct: 10,      // we are "clearly above market" when more than this % over the market price
  raiseGapPct: 20,       // we are "well under market" (room to raise) when this % or more below it
  minMarginPct: 10,      // never suggest a price below cost + this %
  maxCutPct: 25,         // never cut a price by more than this % in one run
  roundTo: 10,           // round suggested prices UP to the next multiple of this (KES)
  minMatches: 2,         // listings needed (Jumia + Kilimall together) before a price is trusted enough to apply
  delayMs: 1200,         // pause between requests, to be polite to the sites
  sources: ['jumia', 'kilimall'],
};
const cfgFile = new URL('./price-watch.config.json', import.meta.url);
export const CFG = { ...DEFAULTS, ...(existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, 'utf8')) : {}) };

/* ---------- text helpers ---------- */
const STOP = new Set(['the', 'and', 'for', 'with', 'of', 'in', 'a', 'an', 'set', 'new', 'original', 'genuine', 'free', 'delivery', 'kenya', 'by']);
const decode = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

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
  const nums = [...String(text || '').replace(/,/g, '').matchAll(/(\d+(?:\.\d+)?)/g)].map(m => Number(m[1])).filter(n => n > 0);
  return nums.length ? Math.min(...nums) : null;
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

const SOURCES = {
  jumia: { label: 'Jumia', url: q => `https://www.jumia.co.ke/catalog/?q=${encodeURIComponent(q)}`, parse: parseJumia },
  kilimall: { label: 'Kilimall', url: q => `https://www.kilimall.co.ke/search?q=${encodeURIComponent(q)}`, parse: h => parseEmbeddedJson(h, 'kilimall') },
};

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
const roundUp = (n, step) => Math.ceil(n / step) * step;

export function pickMatches(product, listings) {
  const ours = Number(product.price);
  return listings
    .filter(l => l.price >= ours * 0.4 && l.price <= ours * 3)        // ignore accessories and bundles far from our price
    .map(l => ({ ...l, score: matchScore(product, l) }))
    .filter(l => l.score >= 0.75)
    .sort((a, b) => b.score - a.score || a.price - b.price)
    .slice(0, 3);
}

export function assess(product, matches, cfg = CFG) {
  const ours = Number(product.price), cost = Number(product.cost) || 0;
  if (!matches.length) return { status: 'nomatch' };
  const market = median(matches.map(m => m.price));
  const trusted = matches.length >= cfg.minMatches;
  const base = { market, matches, trusted, gapPct: (ours / market - 1) * 100 };
  if (ours > market * (1 + cfg.tolerancePct / 100)) {
    const floor = cost > 0 ? cost * (1 + cfg.minMarginPct / 100) : 0;
    let target = Math.max(roundUp(market, cfg.roundTo), floor ? roundUp(floor, cfg.roundTo) : 0, roundUp(ours * (1 - cfg.maxCutPct / 100), cfg.roundTo));
    if (!cost) return { ...base, status: 'above', blocked: 'no cost on file, so the margin floor cannot be checked' };
    if (target >= ours) return { ...base, status: 'above', blocked: 'already at the minimum margin' };
    const capped = target > roundUp(market, cfg.roundTo);
    return { ...base, status: 'above', target, marginPct: (target / cost - 1) * 100, note: capped ? (target === roundUp(floor, cfg.roundTo) ? 'held at minimum margin' : `cut limited to ${cfg.maxCutPct}%`) : '' };
  }
  if (ours < market * (1 - cfg.raiseGapPct / 100)) return { ...base, status: 'below' };
  return { ...base, status: 'ok' };
}

/* ---------- I/O ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const all = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,name,price,cost,variant_label,unit&order=name.asc&limit=1000&offset=${from}`, { headers: { apikey: KEY } });
    if (!r.ok) throw new Error(`Could not read products from Supabase (${r.status})`);
    const page = await r.json(); all.push(...page);
    if (page.length < 1000) break;
  }
  return all;
}

const health = {};   // per source: pages asked, pages that loaded, pages with readable listings
async function search(src, query) {
  const h = (health[src] ||= { asked: 0, loaded: 0, readable: 0, lastError: '' });
  h.asked++;
  let html;
  try {
    if (process.env.FIXTURE_DIR) {
      const f = `${process.env.FIXTURE_DIR}/${src}.html`;
      html = existsSync(f) ? readFileSync(f, 'utf8') : '';
      if (!html) throw new Error('no fixture');
    } else {
      const r = await fetch(SOURCES[src].url(query), { headers: { 'user-agent': 'Mozilla/5.0 (compatible; StermontPriceWatch/1.0; +https://stermontarcade.co.ke)', 'accept-language': 'en-KE,en;q=0.9' }, signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      html = await r.text();
    }
    h.loaded++;
  } catch (e) { h.lastError = String(e.message || e); return []; }
  const found = SOURCES[src].parse(html);
  if (found.length) h.readable++;
  if (!process.env.FIXTURE_DIR) await sleep(CFG.delayMs);
  return found;
}

const queryFor = p => tokens(p.name).slice(0, 7).join(' ');
const kes = n => 'KSh ' + Math.round(n).toLocaleString('en-KE');
const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

async function main() {
  let products = (await getProducts()).filter(p => p && p.id && p.name && Number(p.price) > 0);
  if (process.env.LIMIT) products = products.slice(0, Number(process.env.LIMIT));
  const results = [];
  for (const p of products) {
    const q = queryFor(p), listings = [];
    for (const s of CFG.sources) listings.push(...await search(s, q));
    results.push({ p, ...assess(p, pickMatches(p, listings)) });
  }

  const by = s => results.filter(r => r.status === s);
  const above = by('above'), below = by('below'), ok = by('ok'), nomatch = by('nomatch');
  const actionable = above.filter(r => r.target && r.trusted);
  const label = p => p.name + (p.variant_label ? ` · ${p.variant_label}` : '');
  const links = r => r.matches.map(m => `[${SOURCES[m.source].label} ${kes(m.price)}](${m.url || '#'})`).join(', ');

  const broken = CFG.sources.filter(s => health[s] && health[s].readable === 0);
  let md = `# Price watch ${new Date().toISOString().slice(0, 10)}\n\n`;
  md += `Checked **${products.length}** active items against ${CFG.sources.map(s => SOURCES[s].label).join(' and ')}. `;
  md += `**${above.length}** clearly above market, **${below.length}** well under market, **${ok.length}** in line, **${nomatch.length}** with no confident match.\n`;
  for (const s of broken) md += `\n> ⚠️ **${SOURCES[s].label} returned no readable listings** (${health[s].loaded}/${health[s].asked} pages loaded${health[s].lastError ? `, last error: ${health[s].lastError}` : ''}). The site may be blocking the check or has changed its page, so its prices were not used this week.\n`;

  if (above.length) {
    md += `\n### Above market (${above.length})\nSuggested price matches the market median, never below cost + ${CFG.minMarginPct}%, and cuts are capped at ${CFG.maxCutPct}%.\n\n| Item | Now | Market | Over | Suggested | New margin | Seen at |\n|---|---|---|---|---|---|---|\n`;
    for (const r of above.sort((a, b) => b.gapPct - a.gapPct).slice(0, 60))
      md += `| ${label(r.p)} | ${kes(r.p.price)} | ${kes(r.market)} | +${r.gapPct.toFixed(0)}% | ${r.target ? kes(r.target) + (r.note ? ` (${r.note})` : '') : `no change: ${r.blocked}`}${r.target && !r.trusted ? ' (only 1 listing, not auto-applied)' : ''} | ${r.target ? r.marginPct.toFixed(0) + '%' : '-'} | ${links(r)} |\n`;
    if (above.length > 60) md += `\n…and ${above.length - 60} more in the CSV.\n`;
  }
  if (below.length) {
    md += `\n### Well under market (${below.length}) - room to raise, not changed automatically\n`;
    for (const r of below.sort((a, b) => a.gapPct - b.gapPct).slice(0, 25)) md += `- ${label(r.p)}: you ${kes(r.p.price)} vs market ${kes(r.market)} (${r.gapPct.toFixed(0)}%)\n`;
  }
  md += `\n_${nomatch.length} items had no confident match (specialist or locally sourced products are common here). Matching is strict on sizes and model names, so a missing match is safer than a wrong one._\n`;

  /* optional apply step */
  let applied = 0, applyNote = '';
  if (process.env.APPLY === '1') {
    const svc = process.env.SUPABASE_SERVICE_KEY;
    if (!svc) applyNote = 'Apply was requested but the SUPABASE_SERVICE_KEY secret is not set, so nothing was changed.';
    else {
      writeFileSync('price-watch-backup.csv', 'id,name,old_price\n' + actionable.map(r => [r.p.id, r.p.name, r.p.price].map(csvCell).join(',')).join('\n') + '\n');
      for (const r of actionable) {
        const res = await fetch(`${SB}/rest/v1/products?id=eq.${encodeURIComponent(r.p.id)}`, { method: 'PATCH', headers: { apikey: svc, authorization: `Bearer ${svc}`, 'content-type': 'application/json', prefer: 'return=minimal' }, body: JSON.stringify({ price: r.target }) });
        if (res.ok) { applied++; r.applied = true; } else applyNote += `\nCould not update ${label(r.p)} (${res.status}).`;
      }
      applyNote = `Applied **${applied}** price cut${applied === 1 ? '' : 's'}. Previous prices are in the price-watch-backup.csv artifact of this run.` + applyNote;
    }
    md += `\n### Applied\n${applyNote}\n`;
  } else if (actionable.length) {
    md += `\n**To apply the ${actionable.length} trusted cut${actionable.length === 1 ? '' : 's'}:** Actions tab → Weekly price watch → Run workflow → tick "apply". Nothing changes until you do.\n`;
  }

  writeFileSync('price-watch.csv', 'id,name,status,our_price,cost,market_median,gap_pct,suggested,matches\n' + results.map(r => [r.p.id, label(r.p), r.status, r.p.price, r.p.cost ?? '', r.market ? Math.round(r.market) : '', r.gapPct != null ? r.gapPct.toFixed(1) : '', r.target ?? '', (r.matches || []).map(m => `${m.source}:${m.price}:${m.name}`).join(' | ')].map(csvCell).join(',')).join('\n') + '\n');
  console.log(md);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `items=${above.length + below.length + broken.length}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await main();
