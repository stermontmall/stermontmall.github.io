// Fail the catalogue build when active products are missing essential SEO identity or page data.
// This is a structural guard, not a claim that copy, prices, images or rankings are perfect.
const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';

export function auditProducts(rows) {
  const errors = [], warnings = [];
  for (const p of rows) {
    const id = p.id || '(unknown product)';
    if (!String(p.seo_name || '').trim()) errors.push(`${id}: missing seo_name`);
    if (!String(p.seo_title || '').trim()) errors.push(`${id}: missing seo_title`);
    if (String(p.seo_title || '').length > 60) errors.push(`${id}: seo_title exceeds 60 characters (${p.seo_title.length})`);
    if (p.category_id == null) errors.push(`${id}: missing category_id`);
    if (!Array.isArray(p.images) || p.images.length === 0) errors.push(`${id}: no product image reference`);
    if ((p.images || []).some(u => /stermontmall\.github\.io\/product-photos\//i.test(String(u)))) {
      warnings.push(`${id}: legacy github.io product-photo URL requires availability and visual-match verification`);
    }
  }
  return { errors, warnings, count: rows.length };
}

async function main() {
  const url = `${SB}/rest/v1/products?active=eq.true&select=id,seo_name,seo_title,category_id,images&limit=1000`;
  const response = await fetch(url, { headers: { apikey: KEY, accept: 'application/json' } });
  if (!response.ok) throw new Error(`Supabase catalogue audit failed: HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Supabase catalogue audit returned an invalid response');
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
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
