// Stermont Arcade - product watch. Prints a fingerprint (hash=...) of everything that shows on the generated product pages.
// Runs from .github/workflows/product-watch.yml every 5 minutes; when the fingerprint is new, that workflow starts "Build product pages".
// Only active products count (the same filter generate-products.mjs uses). Stock counts only as in stock / out of stock, so a normal sale does not trigger a rebuild.
// Env: PRODUCTS_JSON (local test file). No installs needed, Node 18+.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SB = process.env.SUPABASE_URL || 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public read key, same one stock-report.mjs uses
const COLS = 'id,slug,name,seo_name,seo_title,price,old_price,unit,variant_group,variant_label,stock,images,description,featured,category_id';

async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=${COLS}&order=id.asc&limit=1000&offset=${from}`, { headers: { apikey: KEY }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('Could not read products from Supabase: HTTP ' + r.status);
    const rows = await r.json(); out.push(...rows); if (rows.length < 1000) break;
  }
  return out;
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
