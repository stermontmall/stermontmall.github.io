import assert from 'node:assert/strict';
import { HUBS, applyCategoryHubs } from './category-hubs.mjs';

const a = { id: 'a' }, b = { id: 'b' }, c = { id: 'c' };
const input = {
  'mens-fashion': { name: "Men's Fashion", items: [a] },
  'womens-fashion': { name: "Women's Fashion", items: [b] },
  'phones-tablets': { name: 'Phones & Tablets', items: [c] },
  'televisions': { name: 'Televisions', items: [a] },
  'bluetooth-speakers': { name: 'Bluetooth Speakers', items: [b] },
  'computing': { name: 'Computing', items: [c] },
  'tvs-audio': { name: 'TVs & Audio', items: [a] }
};
const output = applyCategoryHubs(input);
assert.deepEqual(output.fashion.items, [a, b]);
assert.deepEqual(output['phones-accessories'].items, [c]);
assert.deepEqual(output['tvs-audio'].items, [a, b]);
assert.deepEqual(output['tv-audio-video'].items, [a, b]);
assert.deepEqual(output['computers-accessories'].items, [c]);
assert.equal(output['home-kitchen'], undefined);
assert.equal(input.fashion, undefined, 'input map must not be mutated');
assert.ok(HUBS['tv-audio-video'].kids.includes('tvs-audio'));
console.log('Category hub aggregation tests passed.');
