import assert from 'node:assert/strict';
import { normalizeCategoryLinks, resolveCategoryPath } from './category-links.mjs';

const existing = new Set(['pest-control-fumigation', 'agrovet', 'home-kitchen', 'products']);
assert.equal(resolveCategoryPath('rodent-control', existing), '/c/pest-control-fumigation.html');
assert.equal(resolveCategoryPath('animal-feeds', existing), '/c/agrovet.html');
assert.equal(resolveCategoryPath('health-beauty', existing), '/products.html');
assert.equal(resolveCategoryPath('toys-games', existing), '/products.html');
assert.equal(resolveCategoryPath('home-kitchen', existing), '/c/home-kitchen.html');
assert.equal(resolveCategoryPath('unknown-category', existing), '/products.html');

const html = '<a href="/c/rodent-control.html">Rodent Control</a> <a href="https://stermontarcade.co.ke/c/health-beauty.html">Health &amp; Beauty</a>';
const normalized = normalizeCategoryLinks(html, existing);
assert.match(normalized, /href="\/c\/pest-control-fumigation\.html"/);
assert.match(normalized, /href="https:\/\/stermontarcade\.co\.ke\/products\.html"/);
assert.match(normalized, />Browse all products<\/a>/);
assert.equal(normalizeCategoryLinks('<a href="/c/home-kitchen.html">Home</a>', existing), '<a href="/c/home-kitchen.html">Home</a>');
console.log('Category link resolver tests passed.');
