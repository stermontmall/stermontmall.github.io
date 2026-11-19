// Run: node seo-shell-chrome.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addChrome, MARK, SCRIPT } from './seo-shell-chrome.mjs';

const page = '<!doctype html><html><head><title>x</title></head><body><header>h</header><main>m</main></body></html>';
const once = addChrome(page, true);
assert.ok(once.includes(MARK) && once.includes(SCRIPT), 'adds style marker and script');
assert.equal(addChrome(once, true), once, 'idempotent');
assert.equal(once.split('shell-chrome.js').length - 1, 1, 'script added exactly once');
const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/a.html"></head><body></body></html>';
assert.equal(addChrome(stub), stub, 'redirect stub untouched');
assert.equal(addChrome('<p>fragment</p>'), '<p>fragment</p>', 'non-page untouched');

// Product and category pages must NEVER redirect visitors or crawlers (removed 2026-11-03, ranking risk): no script that changes the address.
assert.ok(!once.includes('stm-early') && !once.includes('location.replace'), 'no route script is added to product/category pages');
const legacy = page.replace('</head>', '<!--stm-early--><script>location.replace("/?product=x")</script></head>');
const cleaned = addChrome(legacy, true);
assert.ok(!cleaned.includes('stm-early') && !cleaned.includes('location.replace') && cleaned.includes('<title>x</title>') && cleaned.includes(MARK), 'a legacy redirect is stripped and the page keeps its content and the shell chrome');
assert.equal(addChrome(cleaned, true), cleaned, 'stripping is idempotent');
const chromeJs = readFileSync('shell-chrome.js', 'utf8');
assert.ok(!chromeJs.includes('location.replace'), 'navigation chrome never redirects product/category pages');
assert.ok(!chromeJs.includes('location.href'), 'navigation chrome never rewrites the current URL');
const cat = addChrome(page.replace('<title>x</title>', '<title>x</title><link rel="canonical" href="https://stermontarcade.co.ke/c/example.html">'), true);
assert.ok(cat.includes('rel="canonical"') && !cat.includes('location.replace'), 'canonical metadata stays and no redirect is added');
console.log('seo-shell-chrome tests passed');
