import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseRedirects, writeOldRedirects, LIST } from './old-url-redirects.mjs';

const site = 'https://example.test';
const root = mkdtempSync(join(tmpdir(), 'redir-'));
mkdirSync(join(root, 'p')); mkdirSync(join(root, 'c'));
writeFileSync(join(root, 'p/live.html'), '<h1>Live product</h1>');
writeFileSync(join(root, 'p/variant.html'), `<meta http-equiv="refresh" content="0;url=${site}/p/live.html">`);
writeFileSync(join(root, 'c/farm.html'), '<h1>Farm</h1>');
writeFileSync(join(root, 'c/index.html'), '<h1>All</h1>');
const map = parseRedirects('old_slug,target\nlive,/c/farm.html\nrenamed,/p/live.html\nvia-variant,/p/variant.html\nchain,/p/renamed.html\ncategory,/c/farm.html\ngone,/p/deleted.html\ngone-category,/c/deleted.html\nloop-a,/p/loop-b.html\nloop-b,/p/loop-a.html\n');
const result = writeOldRedirects(map, { root, site });
const page = s => readFileSync(join(root, 'p', s + '.html'), 'utf8');
const goes = (s, t) => assert.ok(page(s).includes(`content="0;url=${site}${t}"`), `${s} should forward to ${t}`);
assert.equal(page('live'), '<h1>Live product</h1>', 'a real page is never overwritten');
goes('renamed', '/p/live.html'); goes('via-variant', '/p/live.html'); goes('chain', '/p/live.html'); goes('category', '/c/farm.html');
for (const s of ['gone', 'gone-category', 'loop-a', 'loop-b']) goes(s, '/c/');
assert.equal(result.kept, 1); assert.equal(result.written, 8);
assert.match(page('renamed'), /<title>Redirecting/);
assert.throws(() => parseRedirects('a,https://evil.test/x'), /line 1/);
assert.throws(() => parseRedirects('a,/c/x.html\na,/c/y.html'), /repeats/);
rmSync(root, { recursive: true, force: true });

// The real list must parse, and the builder must apply it after it has written the real pages.
assert.ok(parseRedirects(readFileSync(LIST, 'utf8')).size >= 797);
const generator = readFileSync('generate-products.mjs', 'utf8');
assert.ok(generator.indexOf('writeOldRedirects(') > generator.indexOf("writeFileSync('products.html'"), 'old redirects must be written after the real pages');
console.log('Old URL redirects: checks passed.');
