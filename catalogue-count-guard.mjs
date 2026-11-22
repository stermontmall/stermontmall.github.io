// Refuses to rebuild product pages from an almost empty catalogue.
// generate-products.mjs deletes every /p/ and /c/ page before it rewrites them, so a catalogue whose
// products are temporarily hidden (for example during a Supabase quota pause) must never reach it.
// Baseline = number of product pages already listed in sitemap-state.json (the last good build).
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
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

async function activeCount() {
  const r = await fetch(NEON_REST + 'rpc/get_product_pages', { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Could not count active Neon products: HTTP ${r.status}`);
  const rows = await r.json();
  if (!Array.isArray(rows)) throw new Error('Neon product count returned an invalid response');
  return rows.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseline = builtProductCount(existsSync('sitemap-state.json') ? readFileSync('sitemap-state.json', 'utf8') : '');
  const active = await activeCount();
  const result = checkCatalogueCount({ active, baseline, allowSmall: process.env.ALLOW_SMALL_CATALOGUE === '1' });
  console.log(result.message);
  if (!result.ok) { console.error('::error::' + result.message); process.exit(1); }
}
