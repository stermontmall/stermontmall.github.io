#!/usr/bin/env node
// Keep every page Google already knows when the generator rebuilds from a smaller (active-only) catalogue.
// generate-products.mjs deletes p/ and c/ and rebuilds sitemaps from the pages it just wrote. This script wraps it:
//
//   node scripts/preserve-legacy-pages.mjs snapshot   (BEFORE generate-products.mjs)
//   node generate-products.mjs
//   node scripts/preserve-legacy-pages.mjs restore    (AFTER generate-products.mjs)
//
// snapshot: copies p/, c/, sitemap-state.json, sitemap-products.xml and sitemap.xml to .build/legacy/.
// restore:
//   * puts back every old /p/ page the generator did not write (product pages and old-link redirect pages),
//     unless its product id (<meta name="stm-id">) was rebuilt under a new address in this run;
//   * puts back an old /c/ category page when it listed more products than the new one (an active-only rebuild
//     would otherwise shrink categories, and a category with fewer than 5 products becomes noindex);
//   * re-adds those URLs to sitemap-products.xml, sitemap.xml and sitemap-state.json, with their old lastmod,
//     but only if they were in the old sitemap and are not noindex;
//   * compares the old and new sitemaps and exits 1 if any /p/ or /c/ URL that was listed before is now missing
//     (set ALLOW_MISSING_URLS=1 to report without failing).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SITE = 'https://stermontarcade.co.ke';
const DIR = process.env.LEGACY_DIR || '.build/legacy';
const mode = process.argv[2];
const read = f => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const htmlIn = d => (existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.html')) : []);
const urlOf = (d, f) => `/${d}/${encodeURIComponent(f.replace(/\.html$/, ''))}.html`;
const locs = f => [...read(f).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const cards = html => (html.match(/data-name="/g) || []).length;
const isNoindex = html => /<meta name="robots" content="[^"]*noindex/i.test(html);
const sha1 = s => createHash('sha1').update(s).digest('hex');
const today = new Date().toISOString().slice(0, 10);

if (mode === 'snapshot') {
  rmSync(DIR, { recursive: true, force: true });
  mkdirSync(DIR, { recursive: true });
  for (const d of ['p', 'c']) if (existsSync(d)) cpSync(d, join(DIR, d), { recursive: true });
  for (const f of ['sitemap-state.json', 'sitemap-products.xml', 'sitemap.xml']) if (existsSync(f)) cpSync(f, join(DIR, f));
  console.log(`Snapshot saved to ${DIR}: ${htmlIn('p').length} /p/ files, ${htmlIn('c').length} /c/ files.`);
} else if (mode === 'restore') {
  if (!existsSync(DIR)) { console.error(`No snapshot in ${DIR}. Run "snapshot" first.`); process.exit(1); }
  let legacyState = {};
  try { legacyState = JSON.parse(read(join(DIR, 'sitemap-state.json')) || '{}'); } catch { legacyState = {}; }
  let state = {};
  try { state = JSON.parse(read('sitemap-state.json') || '{}'); } catch { state = {}; }

  const newIds = new Set(htmlIn('p').map(f => (read(join('p', f)).match(/<meta name="stm-id" content="([^"]*)"/) || [])[1]).filter(Boolean));
  const touched = [];   // [dir, file]
  let pagesBack = 0, catsBack = 0, skippedRenamed = 0;

  for (const f of htmlIn(join(DIR, 'p'))) {
    if (existsSync(join('p', f))) continue;
    const html = read(join(DIR, 'p', f));
    const id = (html.match(/<meta name="stm-id" content="([^"]*)"/) || [])[1];
    if (id && newIds.has(id)) { skippedRenamed++; continue; }
    mkdirSync('p', { recursive: true });
    cpSync(join(DIR, 'p', f), join('p', f));
    touched.push(['p', f]); pagesBack++;
  }
  for (const f of htmlIn(join(DIR, 'c')).filter(n => n !== 'index.html')) {
    const old = read(join(DIR, 'c', f));
    const fresh = existsSync(join('c', f)) ? read(join('c', f)) : null;
    if (fresh !== null && cards(old) <= cards(fresh)) continue;
    mkdirSync('c', { recursive: true });
    cpSync(join(DIR, 'c', f), join('c', f));
    touched.push(['c', f]); catsBack++;
  }

  let products = read('sitemap-products.xml'), main = read('sitemap.xml');
  let listed = 0;
  for (const [d, f] of touched) {
    const u = urlOf(d, f);
    if (!legacyState[u]) continue;                                   // was not in the old sitemap
    const html = read(join(d, f));
    if (isNoindex(html)) continue;                                   // never advertise noindex pages
    const lastmod = legacyState[u].lastmod || today;
    state[u] = { hash: sha1(readFileSync(join(d, f))), lastmod };
    const loc = `<loc>${SITE}${u}</loc>`;
    const entry = `<url>${loc}<lastmod>${lastmod}</lastmod></url>`;
    if (!products.includes(loc)) products = products.replace('</urlset>', entry + '\n</urlset>');
    if (!main.includes(loc)) main = main.replace('</urlset>', '  ' + entry + '\n</urlset>');
    listed++;
  }
  if (products) writeFileSync('sitemap-products.xml', products);
  if (main) writeFileSync('sitemap.xml', main);
  writeFileSync('sitemap-state.json', JSON.stringify(state, null, 1));

  const nowListed = new Set([...locs('sitemap-products.xml'), ...locs('sitemap.xml')]);
  const before = [...new Set([...locs(join(DIR, 'sitemap-products.xml')), ...locs(join(DIR, 'sitemap.xml'))])]
    .filter(u => u.startsWith(SITE + '/p/') || u.startsWith(SITE + '/c/'));
  const missing = before.filter(u => !nowListed.has(u));
  console.log(JSON.stringify({ productPagesRestored: pagesBack, categoryPagesRestored: catsBack, skippedBecauseRebuiltUnderNewAddress: skippedRenamed,
    readdedToSitemaps: listed, urlsInOldSitemaps: before.length, urlsMissingNow: missing.length }, null, 2));
  if (missing.length) {
    console.error('Missing from the new sitemaps (first 20):\n' + missing.slice(0, 20).join('\n'));
    if (!process.env.ALLOW_MISSING_URLS) process.exit(1);
  }
} else {
  console.error('Usage: node scripts/preserve-legacy-pages.mjs snapshot|restore');
  process.exit(2);
}
