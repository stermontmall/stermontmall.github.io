// Stermont Arcade - guard against broken product links.
// Every ACTIVE product in the live catalog must have a built page in p/ (p/<slug>.html, or p/<id>.html for products without a slug).
// Runs at the end of "Build product pages", after the pages were saved. If a product is still missing a page it exits 1, so the run
// turns red and GitHub emails the owner instead of customers finding a 404.
// A product activated while the build was running can show up here once; the next scheduled build (every 30 minutes) fixes it.
//
// Restored 2026-11-23 from 7d1be9f (deleted in 59fdbab). Data source changed from Supabase to the Neon export:
// it reads PRODUCTS_JSON, default .build/products.json (rows: [{id, slug}, ...], the exporter writes more fields, which are ignored).
import { readFileSync, existsSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';

function rows() {
  const file = process.env.PRODUCTS_JSON || '.build/products.json';
  if (!existsSync(file)) throw new Error(`${file} not found (run scripts/export-neon-catalog.mjs first)`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function missingPages(list, has) {
  return list.filter(r => !(r.slug && has(`${r.slug}.html`)) && !has(`${r.id}.html`)).map(r => r.slug || r.id);
}

if (process.argv[1] && process.argv[1].endsWith('check-product-pages.mjs')) {
  const list = rows();
  if (!Array.isArray(list) || !list.length) { console.log('::error::The catalog returned no active products; refusing to pass.'); process.exit(1); }
  const missing = missingPages(list, f => existsSync(`${DIR}/${f}`));
  if (missing.length) {
    console.log(`::error::${missing.length} active product(s) have no page in ${DIR}/ after the build, so their /p/ links would 404: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`OK: all ${list.length} active products have a built page.`);
}
