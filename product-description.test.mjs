// Run: node product-description.test.mjs  (no dependencies)
import assert from 'node:assert/strict';
import { productDescriptionHtml as f } from './product-description.mjs';

// Explicit capital headings become sections and keep their own text.
const a = f('KEY FEATURES: • fast • strong USES: Use on farms. You can order today. DELIVERY: all Kenya.');
assert.match(a, /<h3>Key features &amp; benefits<\/h3><ul><li>fast<\/li><li>strong<\/li><\/ul>/);
assert.match(a, /<h3>Uses &amp; applications<\/h3><p>Use on farms\. You can order today\.<\/p>/);
assert.match(a, /<h3>Ordering, payment &amp; delivery<\/h3><p>all Kenya\.<\/p>/);

// Ordinary words inside sentences are never headings.
assert.equal((f('Short note: we use it and order it.').match(/<h3>/g) || []).length, 1);

// Unlabelled copy is sorted into ordered sub-topics.
const b = f('Bazooka 18EC is an insecticide for vegetables. Suitable for cabbages and tomatoes. Dilute and spray every 14 days. Wear gloves and keep children away. Store in a cool dry place. Order by M-Pesa with delivery across Kenya.');
const heads = [...b.matchAll(/<h3>([^<]*)<\/h3>/g)].map(m => m[1]);
assert.deepEqual(heads, ['Product overview', 'Uses &amp; applications', 'How to use', 'Safety information', 'Storage &amp; handling', 'Ordering, payment &amp; delivery']);

// Empty input, the word undefined and HTML are handled safely.
assert.match(f(''), /will be updated shortly/);
assert.match(f(undefined), /will be updated shortly/);
assert.ok(!f('Plain <b>text</b> here.').includes('<b>'));
console.log('OK: product description sections');
