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
