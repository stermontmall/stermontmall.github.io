// Tests the script in 404.html: legacy .htm aliases and unbuilt category pages may redirect; unknown product pages stay on the noindex 404 page and never loop through ?product=.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync('404.html', 'utf8');
const m = html.match(/<script>\/\* stm-404-fallback[\s\S]*?<\/script>/);
assert.ok(m, '404.html must contain the stm-404-fallback script');
const code = m[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
assert.ok(html.indexOf('stm-404-fallback') < html.indexOf('</head>'), 'script must run in <head> so there is no flash of the 404 page');
assert.ok(/<meta name="robots" content="noindex">/.test(html), '404 page must stay noindex');

const run = pathname => { let to = null; vm.runInNewContext(code, { location: { pathname, search: '?ref=share', hash: '#pack', replace: u => { to = u; } }, encodeURIComponent }); return to; };
const cases = [
  ['/p/alto-100-sl-fungicide-250ml.htm', '/p/alto-100-sl-fungicide-250ml.html?ref=share#pack'],
  ['/p/Some-Slug-2.HTM', '/p/Some-Slug-2.html?ref=share#pack'],
  ['/p/agrimec-018ec-insecticide-100ml.html', null],
  ['/p/confidor-200sl-insecticide-250ml.html', null],
  ['/c/crop-insecticides.html', '/?cat=crop-insecticides'],
  ['/p/Some-Slug-2.html', null],
  ['/p/', null], ['/p/x/y.html', null], ['/blog/missing.html', null], ['/random.html', null],
  ['/p/..%2f..%2fevil.html', null], ['/p/a b.html', null], ['/p/<script>.html', null], ['/p/evil.html?x=1', null],
];
for (const [path, want] of cases) assert.equal(run(path), want, `${path} -> ${want}`);
assert.equal(run('/p/unknown-product.html'), null, 'unknown product must remain on the 404 page and never redirect to ?product=');
console.log(`OK: ${cases.length + 1} 404 fallback cases`);
