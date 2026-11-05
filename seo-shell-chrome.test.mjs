// Run: node seo-shell-chrome.test.mjs
import assert from 'node:assert/strict';
import { addChrome, MARK, SCRIPT } from './seo-shell-chrome.mjs';

const page = '<!doctype html><html><head><title>x</title></head><body><header>h</header><main>m</main></body></html>';
const once = addChrome(page);
assert.ok(once.includes(MARK) && once.includes(SCRIPT), 'adds style marker and script');
assert.equal(addChrome(once), once, 'idempotent');
assert.equal(once.split('shell-chrome.js').length - 1, 1, 'script added exactly once');
const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/a.html"></head><body></body></html>';
assert.equal(addChrome(stub), stub, 'redirect stub untouched');
assert.equal(addChrome('<p>fragment</p>'), '<p>fragment</p>', 'non-page untouched');
console.log('seo-shell-chrome tests passed');
