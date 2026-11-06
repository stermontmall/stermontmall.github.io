// Offline test of the guard: finds the products that have no page, accepts slug pages and id pages.
import assert from 'node:assert/strict';
import { missingPages } from './check-product-pages.mjs';
const have = new Set(['a-slug.html', 'old-id.html']);
const has = f => have.has(f);
assert.deepEqual(missingPages([{ id: 'x1', slug: 'a-slug' }], has), []);
assert.deepEqual(missingPages([{ id: 'old-id', slug: null }], has), []);
assert.deepEqual(missingPages([{ id: 'old-id', slug: 'new-slug' }], has), []);            // page kept under its id address
assert.deepEqual(missingPages([{ id: 'agrimec', slug: 'agrimec' }, { id: 'x1', slug: 'a-slug' }], has), ['agrimec']);
assert.deepEqual(missingPages([{ id: 'nope', slug: null }], has), ['nope']);
console.log('OK: 5 page-guard cases');
