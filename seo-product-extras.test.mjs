import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync('seo-product-extras.mjs', 'utf8');
assert.match(source, /cm = h\\.match\\(\\/<nav class="bc">[\\s\\S]*<a href=/,
  'Product enrichment must select the final (leaf) category in a multi-level breadcrumb.' must select the final (leaf) category in a multi-level breadcrumb.');
assert.match(source, /PEST\\.has\\(slug\\) && slug !== 'rodent-control'/,
  'Rodent-control hardware pages must not inherit generic pesticide mixing/spraying instructions.');

const breadcrumb = '<nav class="bc"><a href="/">Home</a> › <a href="/c/pest-control-fumigation.html">Pest Control</a> › <a href="/c/rodent-control.html">Rodent Control</a></nav>';
const match = breadcrumb.match(/<nav class="bc">[\\s\\S]*<a href="\\/c\\/([^"]+)\\.html">([^<]*)<\\/a>/);
assert.equal(match?.[1], 'rodent-control');
assert.equal(match?.[2], 'Rodent Control');
console.log('Product category targeting and rodent-control safety regression checks passed.');
