// Fail the catalogue build when active products are missing essential SEO identity or page data.
// This is a structural guard, not a claim that copy, prices, images or rankings are perfect.
const NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
const PAGE_SIZE = 200;
async function getActiveProducts() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const r = await fetch(NEON_REST + 'rpc/get_product_pages', {
      headers: { Range: offset + '-' + (offset + PAGE_SIZE - 1), 'Range-Unit': 'items' },
      signal: AbortSignal.timeout(30000)
    });
    if (!r.ok) throw new Error('Neon catalogue read failed: HTTP ' + r.status);
    const batch = await r.json();
    if (!Array.isArray(batch)) throw new Error('Neon catalogue returned a non-array response');
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

export function auditProducts(rows) {
  const errors = [], warnings = [];
  for (const p of rows) {
    const id = p.id || '(unknown product)';
    if (!String(p.seo_name || '').trim()) errors.push(`${id}: missing seo_name`);
    if (!String(p.seo_title || '').trim()) errors.push(`${id}: missing seo_title`);
    if (String(p.seo_title || '').length > 60) errors.push(`${id}: seo_title exceeds 60 characters (${p.seo_title.length})`);
    if (p.category_id == null) errors.push(`${id}: missing category_id`);
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

async function main() {
  const rows = await getActiveProducts();
  const result = auditProducts(rows);
  console.log(`SEO catalogue guard: checked ${result.count} active Neon products.`);
  for (const warning of result.warnings) console.warn('WARNING:', warning);
  if (result.errors.length) {
    for (const error of result.errors) console.error('ERROR:', error);
    throw new Error(`SEO catalogue guard failed with ${result.errors.length} issue(s)`);
  }
  console.log(`SEO catalogue guard passed. ${result.warnings.length} image URL warning(s).`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-catalog-guard.mjs')) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
