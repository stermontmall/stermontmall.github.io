// Fail the catalogue build when active products are missing essential SEO identity or page data.
// This is a structural guard, not a claim that copy, prices, images or rankings are perfect.
//
// Restored 2026-11-23 from 685d1e2 (deleted in 7f1ef41). Data source changed from Supabase to the Neon export
// (.build/products.json). The export carries the category as a nested `categories` object instead of `category_id`,
// so either one counts as "has a category".
import { readFileSync, existsSync } from 'node:fs';

export function auditProducts(rows) {
  const errors = [], warnings = [];
  for (const p of rows) {
    const id = p.id || '(unknown product)';
    if (!String(p.seo_name || '').trim()) errors.push(`${id}: missing seo_name`);
    if (!String(p.seo_title || '').trim()) errors.push(`${id}: missing seo_title`);
    if (String(p.seo_title || '').length > 60) errors.push(`${id}: seo_title exceeds 60 characters (${p.seo_title.length})`);
    if (p.category_id == null && !p.categories) errors.push(`${id}: missing category_id`);
    // A stray backslash (e.g. a broken regexp_replace leaving a literal \1 in names) must never reach page titles, H1s or links.
    for (const f of ['name', 'seo_name', 'seo_title', 'variant_label']) {
      if (String(p[f] || '').includes('\\')) errors.push(`${id}: ${f} contains a stray backslash (${JSON.stringify(p[f])})`);
    }
    if (!Array.isArray(p.images) || p.images.length === 0) errors.push(`${id}: no product image reference`);
    if ((p.images || []).some(u => /stermontmall\.github\.io\/product-photos\//i.test(String(u)))) {
      warnings.push(`${id}: legacy github.io product-photo URL requires availability and visual-match verification`);
    }
  }
  return { errors, warnings, count: rows.length };
}

function main() {
  const file = process.env.PRODUCTS_JSON || '.build/products.json';
  if (!existsSync(file)) throw new Error(`Catalogue audit failed: ${file} not found (run scripts/export-neon-catalogue.mjs first).`);
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`Catalogue audit failed: ${file} is not a JSON array.`);
  const result = auditProducts(rows);
  console.log(`SEO catalogue guard: checked ${result.count} active products.`);
  for (const warning of result.warnings) console.warn('WARNING:', warning);
  if (result.errors.length) {
    for (const error of result.errors) console.error('ERROR:', error);
    throw new Error(`SEO catalogue guard failed with ${result.errors.length} issue(s)`);
  }
  console.log(`SEO catalogue guard passed. ${result.warnings.length} image URL warning(s).`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-catalog-guard.mjs')) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}
