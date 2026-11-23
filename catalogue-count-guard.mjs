// Refuses to rebuild product pages from an almost empty catalogue.
// generate-products.mjs deletes every /p/ and /c/ page before it rewrites them, so a catalogue whose
// products are temporarily hidden or missing must never reach it.
// Baseline = number of product pages already listed in sitemap-state.json (the last good build).
//
// Restored 2026-11-23 from d04b94e (deleted in 8123c4c). Data source changed from Supabase to the Neon export
// (.build/products.json, written by scripts/export-neon-catalog.mjs). Set PRODUCTS_JSON to use another file.
//
// PRESERVE_LEGACY_PAGES=1: scripts/preserve-legacy-pages.mjs puts back the old pages of inactive products after the
// generator runs, so the "at least half of the built pages" ratio no longer applies (only ~136 of ~1,600 products are
// active). In that mode only an absolute floor is enforced (MIN_ACTIVE_PRODUCTS, default 50, same as the exporter).
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const MIN_RATIO = 0.5;
export const MIN_BASELINE = 20;

export function builtProductCount(stateText) {
  try {
    const state = JSON.parse(stateText || '{}');
    return Object.keys(state).filter(u => /^\/p\/[^/]+\.html$/.test(u)).length;
  } catch { return 0; }
}

export function checkCatalogueCount({ active, baseline, allowSmall = false, minRatio = MIN_RATIO }) {
  if (allowSmall) return { ok: true, message: `Small catalogue explicitly allowed (${active} active products).` };
  if (baseline < MIN_BASELINE) return { ok: true, message: `No usable baseline (${baseline} built product pages); ${active} active products.` };
  if (active === 0) return { ok: false, message: `Refusing to rebuild: 0 active products but ${baseline} product pages exist. A rebuild would delete them all.` };
  if (active < baseline * minRatio) return { ok: false, message: `Refusing to rebuild: only ${active} active products against ${baseline} built product pages (minimum ${Math.ceil(baseline * minRatio)}).` };
  return { ok: true, message: `Catalogue size looks healthy: ${active} active products, ${baseline} built product pages.` };
}

function activeCount() {
  const file = process.env.PRODUCTS_JSON || '.build/products.json';
  if (!existsSync(file)) throw new Error(`Could not count active products: ${file} not found (run scripts/export-neon-catalog.mjs first).`);
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`Could not count active products: ${file} is not a JSON array.`);
  return rows.length;   // the exporter only writes active products
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const active = activeCount();
  let result;
  if (process.env.PRESERVE_LEGACY_PAGES === '1') {
    const floor = Number(process.env.MIN_ACTIVE_PRODUCTS || 50);
    result = active >= floor
      ? { ok: true, message: `Legacy pages are preserved; ${active} active products (floor ${floor}).` }
      : { ok: false, message: `Refusing to rebuild: only ${active} active products (floor ${floor}).` };
  } else {
    const baseline = builtProductCount(existsSync('sitemap-state.json') ? readFileSync('sitemap-state.json', 'utf8') : '');
    result = checkCatalogueCount({ active, baseline, allowSmall: process.env.ALLOW_SMALL_CATALOGUE === '1' });
  }
  console.log(result.message);
  if (!result.ok) { console.error('::error::' + result.message); process.exit(1); }
}
