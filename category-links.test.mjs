import assert from 'node:assert/strict';
import { activeCategorySlugsFromPages, normalizeCategoryLinks, resolveCategoryPath } from './category-links.mjs';

const active = activeCategorySlugsFromPages([
  { slug: 'pest-control-fumigation.html', html: '<ul id="category-products"><li data-price="500">One</li></ul>' },
  { slug: 'agrovet.html', html: '<ul id="category-products"><li data-price="250">One</li></ul>' },
  { slug: 'home-kitchen.html', html: '<ul id="category-products"><li data-price="100">One</li></ul>' },
  { slug: 'empty-category.html', html: '<ul id="category-products"></ul>' }
]);
assert.deepEqual([...active].sort(), ['agrovet', 'home-kitchen', 'pest-control-fumigation']);
assert.equal(resolveCategoryPath('rodent-control', active), '/c/pest-control-fumigation.html');
assert.equal(resolveCategoryPath('animal-feeds', active), '/c/agrovet.html');
assert.equal(resolveCategoryPath('toys-games', active), null);
assert.equal(resolveCategoryPath('health-beauty', active), null);
assert.equal(resolveCategoryPath('empty-category', active), null);
assert.equal(resolveCategoryPath('home-kitchen', active), '/c/home-kitchen.html');

const html = '<a href="/c/rodent-control.html">Rodent control products</a> <a href="https://stermontarcade.co.ke/c/health-beauty.html">Health &amp; Beauty</a>';
const normalized = normalizeCategoryLinks(html, active);
assert.match(normalized, /href="\/c\/pest-control-fumigation\.html">Pest Control &amp; Fumigation<\/a>/);
assert.match(normalized, /Health &amp; Beauty(?!<\/a>)/);
assert.doesNotMatch(normalized, /health-beauty\.html/);
assert.equal(normalizeCategoryLinks('<a href="/c/home-kitchen.html">Home</a>', active), '<a href="/c/home-kitchen.html">Home</a>');
console.log('Category link resolver tests passed.');
