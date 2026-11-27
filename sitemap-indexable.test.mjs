import assert from 'node:assert/strict';
import { isIndexablePage } from './sitemap-indexable.mjs';
const u = 'https://example.test/c/a.html';
assert.equal(isIndexablePage(`<meta name="robots" content="index, follow"><link rel="canonical" href="${u}">`, u), true);
assert.equal(isIndexablePage('<meta name="robots" content="noindex, follow">', u), false);
assert.equal(isIndexablePage("<meta name='robots' content='noindex'>", u), false);
assert.equal(isIndexablePage('<link rel="canonical" href="https://example.test/b.html">', u), false);
assert.equal(isIndexablePage('<h1>no tags</h1>', u), true);
// A search-page script that mentions noindex must not hide an indexable page.
assert.equal(isIndexablePage('<meta name="robots" content="index, follow"><script>m.setAttribute("content","noindex,follow")</script>', u), true);
console.log('Sitemap indexable-page checks passed.');
