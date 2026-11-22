// Stermont Arcade - guard against broken product links.
// Every ACTIVE product in the live catalog must have a built page in p/ (p/<slug>.html, or p/<id>.html for products without a slug).
// Runs at the end of "Build product pages", after the pages were saved. If a product is still missing a page it exits 1, so the run
// turns red and GitHub emails the owner instead of customers finding a 404.
// A product activated while the build was running can show up here once; the next scheduled build (every 30 minutes) fixes it.
// Test locally with no network: PRODUCTS_JSON=rows.json node check-product-pages.mjs   (rows: [{id, slug}, ...])
import { readFileSync, existsSync } from 'node:fs';

const NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
const DIR = process.env.P_DIR || 'p';

async function rows() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const r = await fetch(NEON_REST + 'rpc/get_product_pages', { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`Could not read active products from Neon (HTTP ${r.status})`);
  const products = await r.json();
  if (!Array.isArray(products)) throw new Error('Neon returned an invalid product-page list');
  return products.map(({ id, slug }) => ({ id, slug }));
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
