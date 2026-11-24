// Tests that legacy .htm product URLs are upgraded, while missing .html routes remain real 404s.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = readFileSync('404.html', 'utf8');
const m = html.match(/<script>[\s\S]*?Legacy \.htm product URLs[\s\S]*?<\/script>/);
assert.ok(m, '404.html must contain the legacy .htm URL upgrader');
const code = m[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
assert.ok(html.indexOf('Legacy .htm product URLs') < html.indexOf('</head>'), 'script must run in head');
assert.ok(/<meta name="robots" content="noindex">/.test(html), '404 page must stay noindex');
const run = pathname => { let to = null; vm.runInNewContext(code, { location: { pathname, search: '?ref=share', hash: '#pack', replace: u => { to = u; } } }); return to; };
const cases = [
  ['/p/alto-100-sl-fungicide-250ml.htm', '/p/alto-100-sl-fungicide-250ml.html?ref=share#pack'],
  ['/p/Some-Slug-2.HTM', '/p/Some-Slug-2.html?ref=share#pack'],
  ['/p/agrimec-018ec-insecticide-100ml.html', null], ['/c/crop-insecticides.html', null],
  ['/p/Some-Slug-2.html', null], ['/p/', null], ['/p/x/y.html', null], ['/blog/missing.html', null],
  ['/random.html', null], ['/p/..%2f..%2fevil.html', null], ['/p/a b.html', null], ['/p/<script>.html', null], ['/p/evil.html?x=1', null]
];
for (const [path, want] of cases) assert.equal(run(path), want, path + ' -> ' + want);
console.log('OK: ' + cases.length + ' 404 fallback cases');
