import assert from 'node:assert/strict';
import { extractProductDescriptionText } from './seo-description-check.mjs';

const current = `<div class="box product-description pd">
  <h2 class="pd-title">About Sample Product</h2>
  <nav class="pd-tabs"><a href="#pd-1">Overview</a></nav>
  <section class="product-description-section pd-sec" id="pd-1"><h3>Product overview</h3><p>This is the visible product description. It contains useful details about the product and its intended everyday use for customers.</p></section>
  <section class="product-description-section pd-sec" id="pd-2"><h3>Specifications</h3><ul><li>Pack: 500 ml</li></ul></section>
</div>`;
assert.ok(extractProductDescriptionText(current).length > 100, 'current multi-section layout must be counted');

const legacy = '<div class="desc">Legacy product copy with enough visible details to pass the minimum description threshold for this checker.</div>';
assert.ok(extractProductDescriptionText(legacy).length > 70, 'legacy .desc layout must remain supported');

const empty = '<div class="box product-description pd"><nav class="pd-tabs"><a>Overview</a></nav></div>';
assert.equal(extractProductDescriptionText(empty).length, 0, 'navigation alone must not count as product copy');

console.log('Product description extraction tests passed.');
