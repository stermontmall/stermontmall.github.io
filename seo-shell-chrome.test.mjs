// Run: node seo-shell-chrome.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addChrome, MARK, SCRIPT, EARLY, EARLY_MARK } from './seo-shell-chrome.mjs';

const page = '<!doctype html><html><head><title>x</title></head><body><header>h</header><main>m</main></body></html>';
const once = addChrome(page);
assert.ok(once.includes(MARK) && once.includes(SCRIPT), 'adds style marker and script');
assert.equal(addChrome(once, true), once, 'idempotent');
assert.equal(once.split('shell-chrome.js').length - 1, 1, 'script added exactly once');
const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/a.html"></head><body></body></html>';
assert.equal(addChrome(stub), stub, 'redirect stub untouched');
assert.equal(addChrome('<p>fragment</p>'), '<p>fragment</p>', 'non-page untouched');

// Product and category pages must remain on their static URLs; explicit shell deep links remain supported.
assert.equal(EARLY, '', 'no automatic product/category route redirect is injected');
const legacy = page.replace('</head>', '<!--stm-early--><script>location.replace("/?product=x")</script></head>');
const cleaned = addChrome(legacy);
assert.ok(!cleaned.includes(EARLY_MARK) && !cleaned.includes('location.replace'), 'legacy auto-redirect is removed from previously generated pages');
const chromeJs = readFileSync('shell-chrome.js', 'utf8');
assert.ok(!chromeJs.includes('location.replace'), 'navigation chrome never redirects product/category pages');
assert.ok(!chromeJs.includes('location.href'), 'navigation chrome never rewrites the current URL');
const cat = addChrome(page.replace('<title>x</title>', '<title>x</title><link rel="canonical" href="https://stermontarcade.co.ke/c/example.html">'));
assert.ok(!cat.includes('location.replace') && cat.includes('rel="canonical"'), 'static category canonical metadata is retained without a redirect');
console.log('seo-shell-chrome tests passed');
