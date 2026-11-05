import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source = readFileSync('seo-product-extras.mjs', 'utf8');
assert.ok(source.includes("slug !== 'rodent-control'"));
assert.ok(source.includes('cm = h.match(/<nav class="bc">'));
console.log('Product page enrichment regression checks passed.');
