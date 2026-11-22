// Stermont Arcade - product watch. Prints a fingerprint (hash=...) of everything that shows on the generated product pages.
// Runs from .github/workflows/product-watch.yml every 5 minutes; when the fingerprint is new, that workflow starts "Build product pages".
// Only active products count (the same filter generate-products.mjs uses). Stock counts only as in stock / out of stock, so a normal sale does not trigger a rebuild.
// Env: PRODUCTS_JSON (local test file). No installs needed, Node 18+.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';

async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const all = [];
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    const r = await fetch(NEON_REST + 'rpc/get_product_pages', {
      headers: { Range: offset + '-' + (offset + pageSize - 1), 'Range-Unit': 'items' },
      signal: AbortSignal.timeout(30000)
    });
    if (!r.ok) throw new Error('Could not read products from Neon: HTTP ' + r.status);
    const batch = await r.json();
    if (!Array.isArray(batch)) throw new Error('Neon returned an invalid product-watch dataset');
    all.push(...batch);
    if (batch.length < pageSize) return all;
  }
}

export function fingerprint(products) {
  const rows = products.map(p => [p.id, p.slug, p.name, p.seo_name, p.seo_title, p.price, p.old_price, p.unit, p.variant_group, p.variant_label,
    p.stock > 0, p.images, p.description, !!p.featured, p.category_id]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 16);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const list = await getProducts();
  if (!Array.isArray(list) || list.length < 5) throw new Error('Too few products (' + (list && list.length) + '): not rebuilding on a bad read');
  console.error(`product-watch: ${list.length} active products`);
  console.log('hash=' + fingerprint(list));
}
