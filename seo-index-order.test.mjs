// Run: node seo-index-order.test.mjs
import assert from 'node:assert/strict';
import { prioritise } from './seo-index-order.mjs';
const checked = new Map([['a', '2026-11-28T00:00:00Z'], ['b', '2026-11-26T00:00:00Z']]);
assert.deepEqual(prioritise(['a', 'b', 'c', 'd'], checked, 3), ['c', 'd', 'b']);
assert.deepEqual(prioritise(['a', 'b'], new Map(), 5), ['a', 'b']);
console.log('Index check order tests passed.');
