import assert from 'node:assert/strict';
import { builtProductCount, checkCatalogueCount } from './catalogue-count-guard.mjs';

const state = JSON.stringify({ '/p/a.html': {}, '/p/b.html': {}, '/c/x.html': {}, '/c/': {}, '/products.html': {} });
assert.equal(builtProductCount(state), 2, 'only /p/ pages count');
assert.equal(builtProductCount(''), 0);
assert.equal(builtProductCount('not json'), 0);

assert.equal(checkCatalogueCount({ active: 0, baseline: 1700 }).ok, false, 'zero active products must be refused');
assert.equal(checkCatalogueCount({ active: 100, baseline: 1700 }).ok, false, 'a tiny catalogue must be refused');
assert.equal(checkCatalogueCount({ active: 849, baseline: 1700 }).ok, false, 'just under half must be refused');
assert.equal(checkCatalogueCount({ active: 850, baseline: 1700 }).ok, true, 'half or more is fine');
assert.equal(checkCatalogueCount({ active: 1716, baseline: 1700 }).ok, true);
assert.equal(checkCatalogueCount({ active: 0, baseline: 5 }).ok, true, 'no baseline means no block');
assert.equal(checkCatalogueCount({ active: 0, baseline: 1700, allowSmall: true }).ok, true, 'explicit override works');
console.log('catalogue-count-guard tests passed');
