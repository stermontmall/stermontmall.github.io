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

// Early inline script (/p/ and /c/ pages): added once, understands the old ?shell=1 links, and an older copy on an already-built page is replaced.
const early = addChrome(page, true);
assert.ok(early.includes(EARLY_MARK) && early.includes(EARLY), 'early script added');
assert.ok(EARLY.includes('shell=1'), 'early script knows the old ?shell=1 links');
assert.equal(early.split(EARLY_MARK).length - 1, 1, 'early script added exactly once');
assert.equal(addChrome(early, true), early, 'early: idempotent');
const oldEarly = early.replace(EARLY, '<script>/*old inline script*/</script>');
assert.notEqual(oldEarly, early);
assert.equal(addChrome(oldEarly, true), early, 'an older inline script on a built page is replaced by the current one');
console.log('seo-shell-chrome tests passed');
