// Stermont Arcade - guard against broken product links.
// Every ACTIVE product in the live catalog must have a built page in p/ (p/<slug>.html, or p/<id>.html for products without a slug).
// Runs at the end of "Build product pages", after the pages were saved. If a product is still missing a page it exits 1, so the run
// turns red and GitHub emails the owner instead of customers finding a 404.
// A product activated while the build was running can show up here once; the next scheduled build (every 30 minutes) fixes it.
// Test locally with no network: PRODUCTS_JSON=rows.json node check-product-pages.mjs   (rows: [{id, slug}, ...])
import { readFileSync, existsSync } from 'node:fs';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // publishable (public) key, same one the shop and generate-products.mjs use
const DIR = process.env.P_DIR || 'p';

async function rows() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,slug&order=created_at.asc`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error(`Could not read products from Supabase (HTTP ${r.status})`);
  return r.json();
}

export function missingPages(list, has) {
  return list.filter(r => !(r.slug && has(`${r.slug}.html`)) && !has(`${r.id}.html`)).map(r => r.slug || r.id);
}

if (process.argv[1] && process.argv[1].endsWith('check-product-pages.mjs')) {
  const list = await rows();
  if (!Array.isArray(list) || !list.length) { console.log('::error::The catalog returned no active products; refusing to pass.'); process.exit(1); }
  const missing = missingPages(list, f => existsSync(`${DIR}/${f}`));
  if (missing.length) {
    console.log(`::error::${missing.length} active product(s) have no page in ${DIR}/ after the build, so their /p/ links would 404: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`OK: all ${list.length} active products have a built page.`);
}
