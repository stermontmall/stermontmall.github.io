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
  'Useful internal connections',
  'Depth without filler',
  'does not invent claims'
]) if (!src.includes(token)) throw new Error(`Missing content rule: ${token}`);
execFileSync(process.execPath, ['--check', 'seo-doctor.js'], { stdio: 'inherit' });
console.log('SEO Content Doctor + Admin SEO Doctor syntax tests passed.');
