// Refuses to rebuild product pages from an almost empty catalogue.
// generate-products.mjs deletes every /p/ and /c/ page before it rewrites them, so a catalogue whose
// products are temporarily hidden (for example during a Supabase quota pause) must never reach it.
// Baseline = number of product pages already listed in sitemap-state.json (the last good build).
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public (publishable) key, same one generate-products.mjs uses
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
  const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id`, {
    headers: { apikey: KEY, Prefer: 'count=exact', Range: '0-0', accept: 'application/json' },
    signal: AbortSignal.timeout(30000)
  });
  if (!r.ok) throw new Error(`Could not count active products: HTTP ${r.status}: ${(await r.text()).replace(/\s+/g, ' ').slice(0, 300)}`);
  const m = /\/(\d+)$/.exec(r.headers.get('content-range') || '');
  if (!m) throw new Error('Could not count active products: content-range header missing.');
  return Number(m[1]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseline = builtProductCount(existsSync('sitemap-state.json') ? readFileSync('sitemap-state.json', 'utf8') : '');
  const active = await activeCount();
  const result = checkCatalogueCount({ active, baseline, allowSmall: process.env.ALLOW_SMALL_CATALOGUE === '1' });
  console.log(result.message);
  if (!result.ok) { console.error('::error::' + result.message); process.exit(1); }
}
