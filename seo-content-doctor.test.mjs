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
const admin = readFileSync('seo-doctor.js', 'utf8');
for (const token of [
  'Technical Audit & Editorial Review',
  "/functions/v1/seo-review",
  "action:'approve'",
  'pending editorial review',
  // Approval now publishes the SEO title + meta description automatically (seo-publish.yml); the admin must say so and show them.
  'automatically within about 30 minutes',
  'is never published',
  'Will publish. SEO title (',
  'Approved: publishing status',
  'Not published: '
]) if (!admin.includes(token)) throw new Error(`Missing admin approval wording or feature: ${token}`);
for (const stale of ['does not publish live page content', 'approval does not publish', 'queued for the site publishing pipeline'])
  if (admin.includes(stale)) throw new Error(`Admin must not make an outdated or false publishing claim: ${stale}`);
// The approval function must stay staff-only and only act on pending rows (it is deployed in Supabase; this is its source).
const review = readFileSync('supabase/functions/seo-review/index.ts', 'utf8');
for (const token of ['/auth/v1/user', 'staff?select=email', 'status=eq.pending', '"approve" && action !== "reject"', 'reviewed_by: email'])
  if (!review.includes(token)) throw new Error(`Missing seo-review safeguard: ${token}`);
// Publishing of approved proposals: automatic, but never of the brief text and never on generated pages.
const pub = readFileSync('seo-publish.mjs', 'utf8'), pubFlow = readFileSync('.github/workflows/seo-publish.yml', 'utf8');
for (const token of ['never written to a page', 'generated page', 'TRUSTED_MODELS', 'verifyLive'])
  if (!pub.includes(token) && !pub.toLowerCase().includes(token.toLowerCase())) throw new Error(`Missing publisher safeguard: ${token}`);
for (const token of ["cron: '*/30 * * * *'", 'seo-publish.mjs gate', 'seo-publish.mjs verify', 'seo-publish.mjs finalize', 'dry_run'])
  if (!pubFlow.includes(token)) throw new Error(`Missing publish workflow step: ${token}`);
if (pub.includes('draft_markdown')) throw new Error('The publisher must never read or publish the draft_markdown brief.');
execFileSync(process.execPath, ['--check', 'seo-doctor.js'], { stdio: 'inherit' });
console.log('SEO Content Doctor + Admin SEO Doctor syntax tests passed.');

const doctor = readFileSync('seo-doctor.js', 'utf8');
for (const token of [
  "fetch('/sitemap.xml'",
  'weighted',
  'canonicalValid',
  'imagesWithAlt',
  'internalLinks',
  'jsonLdCount',
  'grid.append(k)'
]) if (!doctor.includes(token)) throw new Error(`Missing SEO Doctor audit feature: ${token}`);
const edge = readFileSync('supabase/functions/seo-research/index.ts', 'utf8');
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
  'var actionable=ps;',
  "Showing all '+actionable.length+' pending proposal(s). Scores are automated estimates and do not replace editorial review.",
  "&offset='+offset",
  'h1Text:',
  'h2Texts:'
]) if (!ratingDoctor.includes(token)) throw new Error(`Missing SEO Doctor queue/filter/context feature: ${token}`);
if (ratingDoctor.includes('&limit=30')) throw new Error('SEO Doctor must not truncate the pending proposal queue at 30.');

for (const token of ['Overall site rating', 'Product page rating', 'Category page rating', 'Technical SEO rating', 'ratingLabel(v)', 'No matching pages were scanned']) if (!ratingDoctor.includes(token)) throw new Error(`Missing SEO rating dashboard feature: ${token}`);
if (!adminHtml.includes('seo-doctor.js?v=17')) throw new Error('Admin must load the current SEO Doctor cache version including the publishing status panel.');
console.log('SEO Doctor rating dashboard regression checks passed.');

const optimizer = readFileSync('product-seo-optimizer.js', 'utf8');
for (const token of [
  'Product SEO Optimizer',
  '/rest/v1/products?select=id,slug,name,description,images,categories(name,slug)',
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
  'function preview(name,desc)',
  "Buy '+n+' in Kenya. ",
  'product name once',
  'Do not add unverified M-Pesa'
]) if (!optimizer.includes(token)) throw new Error(`Missing product SEO optimizer safeguard or feature: ${token}`);
execFileSync(process.execPath, ['--check', 'product-seo-optimizer.js'], { stdio: 'inherit' });
if (!adminHtml.includes('product-seo-optimizer.js?v=5')) throw new Error('Admin must load the current product SEO optimizer.');
console.log('Product SEO Optimizer regression checks passed.');
