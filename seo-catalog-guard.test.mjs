import assert from 'node:assert/strict';
import { auditProducts } from './seo-catalog-guard.mjs';

const good = {
  id: 'sample',
  seo_name: 'Sample Product',
  seo_title: 'Sample Product – Price in Kenya',
  category_id: 12,
  images: ['https://example.com/sample.jpg']
};
assert.deepEqual(auditProducts([good]).errors, []);
assert.equal(auditProducts([good]).count, 1);

const bad = { ...good, id: 'bad', seo_name: '', seo_title: 'x'.repeat(61), category_id: null, images: [] };
const result = auditProducts([bad]);
assert.equal(result.errors.length, 4);
assert.ok(result.errors.some(x => x.includes('missing seo_name')));
assert.ok(result.errors.some(x => x.includes('exceeds 60')));
assert.ok(result.errors.some(x => x.includes('missing category_id')));
assert.ok(result.errors.some(x => x.includes('no product image reference')));

const legacy = auditProducts([{ ...good, images: ['https://stermontmall.github.io/product-photos/old.jpg'] }]);
assert.equal(legacy.errors.length, 0);
assert.equal(legacy.warnings.length, 1);

const slash = auditProducts([{ ...good, id: 'slash', seo_name: 'Air Chopper 7.5SC Insecticide \\1 100 ml' }]);
assert.equal(slash.errors.length, 1);
assert.ok(slash.errors[0].includes('stray backslash'));
assert.deepEqual(auditProducts([{ ...good, variant_label: '100 ml' }]).errors, []);

console.log('SEO catalogue guard tests passed.');
