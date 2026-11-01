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
  "Prefer:'return=representation'",
  'no proposal row was updated',
  'publish content, or change live pages',
  'pending editorial review'
]) if (!admin.includes(token)) throw new Error(`Missing admin approval safeguard: ${token}`);
if (admin.includes('queued for the site publishing pipeline')) throw new Error('Do not claim an approval publishes content.');
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
if (!adminHtml.includes('seo-doctor.js?v=11')) throw new Error('Admin must load the updated SEO Doctor script cache version.');

const ratingDoctor = readFileSync('seo-doctor.js', 'utf8');
for (const token of ['Overall site rating', 'Product page rating', 'Category page rating', 'Technical SEO rating', 'ratingLabel(v)', 'No matching pages were scanned']) if (!ratingDoctor.includes(token)) throw new Error(`Missing SEO rating dashboard feature: ${token}`);
if (!adminHtml.includes('seo-doctor.js?v=12')) throw new Error('Admin must load SEO Doctor rating dashboard cache version.');
console.log('SEO Doctor rating dashboard regression checks passed.');
