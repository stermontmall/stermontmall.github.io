// Stermont Arcade - catalog-snapshot
// Rewrites catalog-snapshot.json from the live Neon catalog (public.storefront_products + public.categories).
// The shop (mobile-shell/app.js) loads this file only when Neon cannot be read in the browser, so it must never be empty or badly out of date.
//
//   NEON_DATABASE_URL=... node catalog-snapshot.mjs          write the file if the catalog changed
//   NEON_DATABASE_URL=... node catalog-snapshot.mjs --check  exit 1 if the file is out of date (no write)
//
// Same file shape as before: { generated, products: [...], categories: [...] }.
// Safety: the file is NOT overwritten when Neon returns fewer than 20 products or less than half of what the file already has.
import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = 'catalog-snapshot.json';
const SITE = 'https://stermontarcade.co.ke';
const CHECK = process.argv.includes('--check');
const dbUrl = process.env.NEON_DATABASE_URL;
if (!dbUrl) { console.error('NEON_DATABASE_URL is missing. Add it as a GitHub Actions secret.'); process.exit(1); }
const sql = neon(dbUrl);

const num = v => (v === null || v === undefined ? null : Number(v));
// Our own photos are stored as absolute URLs in Neon; the snapshot keeps them site-relative (as before). ImageKit URLs stay absolute.
const img = u => (typeof u === 'string' && u.startsWith(SITE + '/') ? u.slice(SITE.length) : u);

const rows = await sql`SELECT id, slug, name, category_id, price, old_price, stock, featured, unit, variant_group, variant_label, images
                       FROM public.storefront_products ORDER BY name, id`;
const cats = await sql`SELECT id, name, slug, parent_id, sort_order, is_promo FROM public.categories ORDER BY sort_order, name`;

const products = rows.map(r => ({
  id: r.id, slug: r.slug, name: r.name, category_id: r.category_id,
  price: num(r.price), old_price: num(r.old_price), stock: num(r.stock), featured: !!r.featured,
  unit: r.unit ?? '', variant_group: r.variant_group ?? null, variant_label: r.variant_label ?? null,
  images: (Array.isArray(r.images) ? r.images : []).map(img),
}));
const categories = cats.map(c => ({ id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id ?? null, sort_order: num(c.sort_order) ?? 0, is_promo: !!c.is_promo }));

let old = null;
if (existsSync(FILE)) { try { old = JSON.parse(readFileSync(FILE, 'utf8')); } catch { /* unreadable file: treat as missing */ } }
const oldCount = old && Array.isArray(old.products) ? old.products.length : 0;

if (products.length < 20 || (oldCount && products.length < oldCount / 2)) {
  console.error(`Refusing to overwrite ${FILE}: Neon returned ${products.length} products (file has ${oldCount}). Check the catalog first.`);
  process.exit(1);
}

const same = old && JSON.stringify(old.products) === JSON.stringify(products) && JSON.stringify(old.categories) === JSON.stringify(categories);
if (same) { console.log(`${FILE} is already up to date (${products.length} products, ${categories.length} categories).`); process.exit(0); }
if (CHECK) { console.log(`${FILE} is out of date (file ${oldCount} products, Neon ${products.length}).`); process.exit(1); }

const out = JSON.stringify({ generated: new Date().toISOString().slice(0, 10), products, categories });
JSON.parse(out);   // must be valid JSON before it replaces the old file
writeFileSync(FILE, out);
console.log(`Wrote ${FILE}: ${products.length} products, ${categories.length} categories (was ${oldCount} products).`);
