// Run: node seo-shell-chrome.test.mjs
import assert from 'node:assert/strict';
import { addChrome, MARK, SCRIPT, EARLY, EARLY_MARK } from './seo-shell-chrome.mjs';

const page = '<!doctype html><html><head><title>x</title></head><body><header>h</header><main>m</main></body></html>';
const once = addChrome(page);
assert.ok(once.includes(MARK) && once.includes(SCRIPT), 'adds style marker and script');
assert.equal(addChrome(once), once, 'idempotent');
assert.equal(once.split('shell-chrome.js').length - 1, 1, 'script added exactly once');
const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/a.html"></head><body></body></html>';
assert.equal(addChrome(stub), stub, 'redirect stub untouched');
assert.equal(addChrome('<p>fragment</p>'), '<p>fragment</p>', 'non-page untouched');

// No route-changing script may be emitted. Legacy scripts on previously generated pages are stripped by addChrome.
assert.equal(EARLY, '', 'no early redirect script is configured');
const legacy = page.replace('</head>', '<!--stm-early--><script>location.replace("/?product=x")</script></head>');
const cleaned = addChrome(legacy, true);
assert.ok(!cleaned.includes('stm-early') && !cleaned.includes('location.replace'), 'legacy early redirect is removed');
assert.ok(cleaned.includes('rel="canonical"') === false, 'test fixture does not invent a canonical tag');
console.log('seo-shell-chrome tests passed');
