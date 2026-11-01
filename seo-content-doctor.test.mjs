import { existsSync, readFileSync } from 'node:fs';

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
console.log('SEO Content Doctor tests passed.');
