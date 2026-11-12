// Tests the script in 404.html: an unbuilt /p/<slug>.html or /c/<slug>.html opens the shop at /?product=<slug> or /?cat=<slug>; anything else stays on the 404 page.
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
  ['/p/agrimec-018ec-insecticide-100ml.html', '/?product=agrimec-018ec-insecticide-100ml'],
  ['/p/confidor-200sl-insecticide-250ml.html', '/?product=confidor-200sl-insecticide-250ml'],
  ['/c/crop-insecticides.html', '/?cat=crop-insecticides'],
  ['/p/Some-Slug-2.html', '/?product=Some-Slug-2'],
  ['/p/', null], ['/p/x/y.html', null], ['/blog/missing.html', null], ['/random.html', null],
  ['/p/..%2f..%2fevil.html', null], ['/p/a b.html', null], ['/p/<script>.html', null], ['/p/evil.html?x=1', null],
];
for (const [path, want] of cases) assert.equal(run(path), want, `${path} -> ${want}`);
console.log(`OK: ${cases.length} 404 fallback cases`);
