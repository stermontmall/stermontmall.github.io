import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeLegacyRedirects, redirectPage } from './legacy-redirects.mjs';
import { belongsInSitemap } from './sitemap-filter.mjs';

const root = mkdtempSync(join(tmpdir(), 'stm-'));
mkdirSync(join(root, 'p')); mkdirSync(join(root, 'c'));
const SITE = 'https://stermontarcade.co.ke';
const page = (path, robots = 'index, follow', canonical = SITE + path) =>
  writeFileSync(join(root, path), `<meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}">`);
page('/p/live.html'); page('/c/cat.html'); page('/c/small.html', 'noindex, follow'); page('/c/copy.html', 'index', SITE + '/c/cat.html');
writeFileSync(join(root, 'p/alias.html'), redirectPage('/p/live.html'));

const r = writeLegacyRedirects({ old: '/p/live.html', chained: '/p/alias.html', gone: '/c/cat.html', live: '/c/cat.html', lost: '/p/none.html', '../bad': '/c/cat.html' }, root);
assert.deepEqual({ written: r.written, live: r.live, skipped: r.skipped }, { written: 3, live: 1, skipped: ['lost', '../bad'] });
assert.match(readFileSync(join(root, 'p/chained.html'), 'utf8'), /url=https:\/\/stermontarcade\.co\.ke\/p\/live\.html"/);
assert.doesNotMatch(readFileSync(join(root, 'p/live.html'), 'utf8'), /refresh/, 'a live product page is never overwritten');
assert.equal(existsSync(join(root, 'p/lost.html')), false);

assert.equal(belongsInSitemap(SITE + '/p/live.html', root), true);
for (const path of ['/c/small.html', '/c/copy.html', '/p/old.html', '/p/none.html']) assert.equal(belongsInSitemap(SITE + path, root), false, path);

// Every listed address is well formed, and the build must run the redirect step.
const map = JSON.parse(readFileSync('legacy-redirects.json', 'utf8'));
for (const [slug, target] of Object.entries(map)) {
  assert.match(slug, /^[a-z0-9][a-z0-9-]*$/);
  assert.match(target, /^\/(p|c)\/[a-z0-9][a-z0-9-]*\.html$/);
}
assert.match(readFileSync('generate-products.mjs', 'utf8'), /writeLegacyRedirects\(/);
console.log(`Legacy redirects and sitemap filter passed (${Object.keys(map).length} old addresses).`);
