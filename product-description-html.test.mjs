// Run: node product-description-html.test.mjs
import assert from 'node:assert/strict';
import { productDescriptionHtml, splitFaq } from './product-description-html.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const heads = h => [...h.matchAll(/<h3>(.*?)<\/h3>/g)].map(m => m[1].replace(/&amp;/g, '&'));

const advion = 'Tatua Advion is a ready-to-use gel bait. KEY FEATURES • Ready-to-use • No mixing needed SPECIFICATIONS • Brand: Tatua • Form: Gel WHERE IT HELPS Cockroaches hide in tight places. HOW TO USE IT Clean the area first. Apply small dots. BEFORE YOU START • Wipe the cupboards • Fix leaks SAFETY Read the label before use. STORAGE Keep in a cool, dry place. FREQUENTLY ASKED QUESTIONS Why a gel? Cockroaches eat it. It is neat. How much? Use small dots. ORDER Order online. PRODUCT BUYING GUIDE: generic filler that must be removed.';
const out = productDescriptionHtml(advion);
assert.deepEqual(heads(out), ['Product overview', 'Key features & benefits', 'Specifications & product details', 'Uses & applications', 'How to use', 'Before you start', 'Safety information', 'Storage & handling', 'Frequently asked questions', 'Ordering & delivery']); n++;
ok(!out.includes('Product information'), 'no generic repeated heading');
ok(!/generic filler/.test(out), 'buying-guide boilerplate removed');
ok(/<h3>Key features &amp; benefits<\/h3><ul><li>Ready-to-use<\/li><li>No mixing needed<\/li><\/ul>/.test(out), 'features are a list under their own heading');
ok(/<h3>Safety information<\/h3><p>Read the label before use\.<\/p>/.test(out), 'safety text sits under Safety');
ok(/<strong>Why a gel\?<\/strong><br>Cockroaches eat it\. It is neat\./.test(out), 'FAQ question and multi-sentence answer');
ok(/<strong>How much\?<\/strong><br>Use small dots\./.test(out), 'second FAQ item');

// no labels: unchanged behaviour
const plain = productDescriptionHtml('First paragraph.\n\nSecond paragraph.');
assert.deepEqual(heads(plain), ['Product overview', 'Product details']); n++;
// words that merely look like labels in lower case are not headings
ok(heads(productDescriptionHtml('Use it safely and order today. Storage is easy.')).length === 1, 'lowercase words never create headings');
// duplicate label merges, empty source falls back
assert.deepEqual(heads(productDescriptionHtml('Intro. SAFETY Wear gloves. STORAGE Keep dry. SAFETY Wash hands.')), ['Product overview', 'Safety information', 'Storage & handling']); n++;
ok(productDescriptionHtml('').includes('will be updated shortly'), 'empty fallback');
// FAQ splitter refuses text that is not a clean Q&A list
ok(splitFaq('Just one sentence.') === null && splitFaq('Only one? Yes.') === null, 'non-FAQ text is left alone');
console.log(`product-description-html: ${n} checks passed`);
