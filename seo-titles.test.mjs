// Run: node seo-titles.test.mjs   (no dependencies)
import assert from 'node:assert/strict';
import { pageTitle } from './seo-titles.mjs';

const row = { seo_name: 'Top-Rated Absolute 375SC Systemic Fungicide', seo_title: 'Top-Rated Absolute 375SC Systemic Fungicide (1L) \u2013 Best Price in Kenya | Stermont Arcade' };
// single-size page: the owner's title, exactly
assert.equal(pageTitle(row, false), row.seo_title);
// pack-size page: size in brackets left out, tail unchanged
assert.equal(pageTitle(row, true), 'Top-Rated Absolute 375SC Systemic Fungicide \u2013 Best Price in Kenya | Stermont Arcade');
// a bracket that is NOT a size stays when seo_name keeps it
const e = { seo_name: 'Original Euroken 50x55 Standing Cooker (3G+1E)', seo_title: 'Original Euroken 50x55 Standing Cooker (3G+1E) \u2013 Best Price in Kenya | Stermont Arcade' };
assert.equal(pageTitle(e, true), e.seo_title);
// no title -> empty (page keeps its generated title); missing seo_name on a pack-size page -> exact title
assert.equal(pageTitle({ seo_name: 'x', seo_title: '' }, false), '');
assert.equal(pageTitle({ seo_name: null, seo_title: row.seo_title }, true), row.seo_title);
console.log('OK: 5 checks, 0 violations');
