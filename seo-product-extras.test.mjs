import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source = readFileSync('seo-product-extras.mjs', 'utf8');
assert.ok(source.includes("slug !== 'rodent-control'"));
// The product's category must be read from the breadcrumb <nav> only. A page-wide greedy match picked the LAST /c/ link on the page
// (a "Related categories" link) and put 353 of 602 products under the wrong category in the breadcrumb and its JSON-LD.
assert.ok(source.includes("cm = (h.match(/<nav class=\"bc\">([\\s\\S]*?)<\\/nav>/) || [, ''])[1].match("));
const pick = h => (h.match(/<nav class="bc">([\s\S]*?)<\/nav>/) || [, ''])[1].match(/^[\s\S]*<a href="\/c\/([^"]+)\.html">([^<]*)<\/a>/);
const page = '<nav class="bc"><a href="https://stermontarcade.co.ke/">Home</a> › <a href="/c/adjuvants-growth-regulators.html">Adjuvants &amp; Growth Regulators</a> › Rootex 6</nav>'
  + '<section><div class="silo-links"><a href="/c/herbicides.html">Herbicides</a><a href="/c/crop-insecticides.html">Crop Insecticides</a></div></section>';
const m = pick(page);
assert.equal(m[1], 'adjuvants-growth-regulators');
assert.equal(m[2], 'Adjuvants &amp; Growth Regulators');
assert.equal(pick('<nav class="bc"><a href="/">Home</a> › Product</nav><a href="/c/x.html">X</a>'), null);   // no category in the breadcrumb: no match, even if the page has other /c/ links
console.log('Product page enrichment regression checks passed.');
