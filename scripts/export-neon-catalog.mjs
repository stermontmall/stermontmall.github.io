#!/usr/bin/env node
// Export the live catalogue from Neon into the JSON files that generate-products.mjs already knows how to read:
//   PRODUCTS_JSON, REVIEWS_JSON and SLUG_REDIRECTS_JSON (the generator's own test hooks).
// This keeps generate-products.mjs untouched while moving its data source from the deleted Supabase project to Neon.
//
// Usage (in the build workflow, after `npm install --no-save pg`):
//   NEON_DATABASE_URL=... node scripts/export-neon-catalog.mjs
//   PRODUCTS_JSON=.build/products.json REVIEWS_JSON=.build/reviews.json SLUG_REDIRECTS_JSON=.build/slug-redirects.json node generate-products.mjs
//
// Only active products are exported (same rule the generator used with Supabase: active=eq.true).
// Safety: exits with an error, and writes nothing, when fewer than MIN_ACTIVE_PRODUCTS (default 50) active products are found,
// so a paused or empty database can never trigger a rebuild from an almost empty catalogue.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.env.EXPORT_DIR || '.build';
const MIN_ACTIVE = Number(process.env.MIN_ACTIVE_PRODUCTS || 50);
const url = process.env.NEON_DATABASE_URL;
if (!url) { console.error('NEON_DATABASE_URL is not set'); process.exit(1); }

const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: true } });
await client.connect();
try {
  const iso = d => (d instanceof Date ? d.toISOString() : d ?? null);
  const num = v => (v === null || v === undefined ? null : Number(v));

  const prod = (await client.query(`
    select p.id, p.product_code, p.created_at, p.updated_at, p.slug, p.name, p.seo_name, p.seo_title,
           p.meta_title, p.meta_description, p.alt_text, p.keywords, p.stock_status, p.price, p.old_price,
           p.unit, p.variant_group, p.variant_label, p.stock, p.images, p.description, p.gtin, p.mpn,
           c.name cat_name, c.slug cat_slug, c.description cat_description,
           c.meta_title cat_meta_title, c.meta_description cat_meta_description
    from public.products p
    left join public.categories c on c.id = p.category_id
    where p.active = true
    order by p.created_at asc, p.id asc`)).rows;

  if (prod.length < MIN_ACTIVE) {
    console.error(`Refusing to export: only ${prod.length} active products (minimum ${MIN_ACTIVE}).`);
    process.exitCode = 1;
  } else {
    const products = prod.map(r => ({
      id: r.id, product_code: r.product_code, created_at: iso(r.created_at), updated_at: iso(r.updated_at),
      slug: r.slug, name: r.name, seo_name: r.seo_name, seo_title: r.seo_title,
      meta_title: r.meta_title, meta_description: r.meta_description, alt_text: r.alt_text,
      keywords: r.keywords, stock_status: r.stock_status, price: num(r.price), old_price: num(r.old_price),
      unit: r.unit, variant_group: r.variant_group, variant_label: r.variant_label, stock: num(r.stock),
      images: Array.isArray(r.images) ? r.images : [], description: r.description, gtin: r.gtin, mpn: r.mpn,
      categories: r.cat_slug ? { name: r.cat_name, slug: r.cat_slug, description: r.cat_description,
        meta_title: r.cat_meta_title, meta_description: r.cat_meta_description } : null
    }));

    const reviews = (await client.query(`
      select product_name, rating, body, reviewer, created_at
      from public.reviews where status = 'approved'
      order by created_at desc limit 1000`)).rows.map(r => ({ ...r, created_at: iso(r.created_at) }));

    const redirects = (await client.query(
      'select old_slug, product_id from public.product_slug_redirects')).rows;

    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'products.json'), JSON.stringify(products));
    writeFileSync(join(OUT, 'reviews.json'), JSON.stringify(reviews));
    writeFileSync(join(OUT, 'slug-redirects.json'), JSON.stringify(redirects));
    console.log(JSON.stringify({
      products: products.length, withCategory: products.filter(p => p.categories).length,
      inStock: products.filter(p => p.stock > 0).length, reviews: reviews.length, slugRedirects: redirects.length, outDir: OUT
    }, null, 2));
  }
} finally {
  await client.end();
}
