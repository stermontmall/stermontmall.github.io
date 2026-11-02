import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

if (!existsSync('seo-content-doctor.mjs')) throw new Error('seo-content-doctor.mjs missing');
const src = readFileSync('seo-content-doctor.mjs', 'utf8');
for (const token of [
  'masterpiece standard',
  'service promise and audience',
  'Process customers can understand',
  'Price or pricing explanation',
  'Local relevance',
  'Safety/trust information',
  'Useful FAQ content',
  'Strong booking next step',
  'Helpful internal connections',
  'Depth without filler',
  'never invents claims'
]) if (!src.includes(token)) throw new Error(`Missing content rule: ${token}`);
const gscSitemaps = readFileSync('seo-google-sitemaps.mjs', 'utf8');
if (!gscSitemaps.includes('${SITE}/services/sitemap-services.xml')) throw new Error('Google Search Console submission must include the service sitemap.');
const admin = readFileSync('seo-doctor.js', 'utf8');
if (!admin.includes('ac.append(view,approve,reject)')) throw new Error('SEO review actions must be attached to every proposal card.');
for (const token of [
  'Technical Audit & Editorial Review',
  "'/functions/v1/seo-review'",
  'superseded_count',
  'publish content, or change live pages',
  'pending editorial review'
]) if (!admin.includes(token)) throw new Error(`Missing admin approval safeguard: ${token}`);
if (admin.includes('queued for the site publishing pipeline')) throw new Error('Do not claim an approval publishes content.');
execFileSync(process.execPath, ['--check', 'seo-doctor.js'], { stdio: 'inherit' });
console.log('SEO Content Doctor + Admin SEO Doctor syntax tests passed.');

const doctor = readFileSync('seo-doctor.js', 'utf8');
for (const token of [
  'function readSitemaps()',
  "'/sitemap-products.xml'",
  "'/sitemap-images.xml'",
  "'/services/sitemap-services.xml'",
  'new AbortController()',
  'Sitemaps checked:',
  'is outside the site origin',
  'weighted',
  'canonicalValid',
  'imagesWithAlt',
  'internalLinks',
  'jsonLdCount',
  'grid.append(k)'
]) if (!doctor.includes(token)) throw new Error(`Missing SEO Doctor audit feature: ${token}`);
const edge = readFileSync('supabase/functions/seo-research/index.ts', 'utf8');
if (!edge.includes('url.pathname.endsWith("/")') || !edge.includes('public HTML page')) throw new Error('SEO research must accept public directory landing pages discovered in sitemaps.');
const reviewEdge = readFileSync('supabase/functions/seo-review/index.ts', 'utf8');
for (const token of ['superseded-', 'superseded_count', 'staff access', 'status=eq.pending']) {
  if (!reviewEdge.includes(token)) throw new Error(`Missing SEO review safety: ${token}`);
}
if (reviewEdge.includes('service_role') && reviewEdge.includes('Access-Control-Allow-Origin: "*"')) throw new Error('SEO review must not expose a wildcard CORS policy.');
for (const token of [
  'weighted-onpage-audit-v2',
  'Unique descriptive title',
  'Valid canonical URL',
  'Indexability signals',
  'Structured data presence',
  'Research limitations',
  'draft_markdown: brief',
  '/auth/v1/user',
  'staff?email=ilike.',
  'Staff access required'
]) if (!edge.includes(token)) throw new Error(`Missing SEO research safeguard: ${token}`);
if (edge.includes('completed_with_errors')) throw new Error('Research run status must match the database status constraint.');
if (edge.includes('draft_markdown: plain')) throw new Error('SEO Doctor must not label copied page text as a generated draft.');
console.log('SEO Doctor weighted audit, evidence and draft safeguards passed.');

const adminHtml = readFileSync('admin.html', 'utf8');
if (adminHtml.includes('seo-doctor.js?v=11')) throw new Error('Admin must not load the stale SEO Doctor script cache version.');

const ratingDoctor = readFileSync('seo-doctor.js', 'utf8');
for (const token of [
  "ps.filter(p=>Number(p.seo_score_before)!==100)",
  "Showing '+actionable.length+' pending item(s) that need improvement.",
  'Perfect 100/100 items are hidden.',
  'offset=',
  'h1Text:',
  'h2Texts:'
]) if (!ratingDoctor.includes(token)) throw new Error(`Missing SEO Doctor queue/filter/context feature: ${token}`);
if (ratingDoctor.includes('&limit=30')) throw new Error('SEO Doctor must not truncate the pending proposal queue at 30.');

for (const token of ['Overall site rating', 'Product page rating', 'Category page rating', 'Technical SEO rating', 'ratingLabel(v)', 'No matching pages were scanned']) if (!ratingDoctor.includes(token)) throw new Error(`Missing SEO rating dashboard feature: ${token}`);
if (!adminHtml.includes('seo-doctor.js?v=19')) throw new Error('Admin must load the current SEO Doctor cache version including the product optimizer.');
console.log('SEO Doctor rating dashboard regression checks passed.');

const optimizer = readFileSync('product-seo-optimizer.js', 'utf8');
for (const token of [
  'Product SEO Optimizer',
  '/rest/v1/products?select=id,slug,name,description,images,categories(name,slug),created_at&active=eq.true&order=created_at.asc&limit=1000',
  'meta[name="stm-id"]',
  'Save reviewed description',
  "Prefer:'return=representation'",
  'expected exactly one updated product',
  'No products changed',
  'Prepare safe fixes',
  'Save prepared fixes (max 20)',
  'description is too short to safely expand',
  'description is near the 4,000-character editor limit',
  'Technical issues such as canonical tags, schema and image alt text need separate fixes',
  'Shop ',
  'slice(0,20)',
  'Product ID mismatch',
  'function pageSlug(p,allIds,used)',
  'async function resolvePage(p,url)',
  'meta[http-equiv="refresh"]',
  'duplicate/redirect aliases skipped',
  'function preview(name,desc)',
  "Buy '+n+' in Kenya. ",
  'product name once',
  'Do not add unverified M-Pesa'
]) if (!optimizer.includes(token)) throw new Error(`Missing product SEO optimizer safeguard or feature: ${token}`);
execFileSync(process.execPath, ['--check', 'product-seo-optimizer.js'], { stdio: 'inherit' });
if (!adminHtml.includes('product-seo-optimizer.js?v=6')) throw new Error('Admin must load the current product SEO optimizer.');
if (!adminHtml.includes('seo-doctor.js?v=19')) throw new Error('Admin must load the current SEO Doctor bundle.');
console.log('Product SEO Optimizer regression checks passed.');
