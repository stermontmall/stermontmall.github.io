// Unit tests for the Google Merchant Center rules (merchant-feed.mjs). No network, no catalogue needed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATEGORY_MAP, feedCategoryXml, feedIdentifierXml, feedShippingXml, feedExcluded } from './merchant-feed.mjs';

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('every mapped category has a numeric Google ID and a full taxonomy path', () => {
  const slugs = Object.keys(CATEGORY_MAP);
  assert.ok(slugs.length >= 66, `expected at least 66 mapped categories, got ${slugs.length}`);
  for (const [slug, v] of Object.entries(CATEGORY_MAP)) {
    assert.ok(Number.isInteger(v.id) && v.id > 0, `${slug}: bad id`);
    assert.ok(typeof v.path === 'string' && v.path.length > 2, `${slug}: bad path`);
  }
});

t('core verticals map to the expected Google categories', () => {
  assert.equal(CATEGORY_MAP['pest-control-fumigation'].path, 'Home & Garden > Household Supplies > Pest Control');
  assert.equal(CATEGORY_MAP['agrovet'].path, 'Business & Industrial > Agriculture');
  assert.equal(CATEGORY_MAP['televisions'].path, 'Electronics > Video > Televisions');
  assert.equal(CATEGORY_MAP['washing-machines'].path, 'Home & Garden > Household Appliances > Laundry Appliances > Washing Machines');
  assert.equal(CATEGORY_MAP['protective-wear-safety'].path, 'Business & Industrial > Work Safety Protective Gear');
  assert.equal(CATEGORY_MAP['mens-sneakers'].path, 'Apparel & Accessories > Shoes');
  assert.equal(CATEGORY_MAP['motorcycle-spare-parts'].path, 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts');
});

t('category XML uses the numeric ID and is empty for unmapped categories', () => {
  assert.equal(feedCategoryXml('pest-control-fumigation'), '<g:google_product_category>728</g:google_product_category>');
  assert.equal(feedCategoryXml('others'), '');
  assert.equal(feedCategoryXml(undefined), '');
});

t('valid GTIN is emitted and replaces identifier_exists', () => {
  const xml = feedIdentifierXml({ gtin: '6 001 234 567 899' });
  assert.ok(xml.startsWith('<g:gtin>'), xml);
  assert.ok(!xml.includes('identifier_exists'));
});

t('GTIN with a bad check digit or length is ignored', () => {
  assert.equal(feedIdentifierXml({ gtin: '6001234567895' }), '<g:identifier_exists>no</g:identifier_exists>');
  assert.equal(feedIdentifierXml({ gtin: '12345' }), '<g:identifier_exists>no</g:identifier_exists>');
});

t('MPN alone is emitted, escaped, and replaces identifier_exists', () => {
  assert.equal(feedIdentifierXml({ mpn: ' AB&C-100 ' }), '<g:mpn>AB&amp;C-100</g:mpn>');
});

t('GTIN and MPN are both emitted when both are valid', () => {
  const xml = feedIdentifierXml({ gtin: '6001234567899', mpn: 'XL-9' });
  assert.ok(xml.includes('<g:gtin>') && xml.includes('<g:mpn>XL-9</g:mpn>') && !xml.includes('identifier_exists'));
});

t('blank identifiers fall back to identifier_exists=no', () => {
  for (const p of [{}, { gtin: '', mpn: '' }, { gtin: null, mpn: '   ' }]) assert.equal(feedIdentifierXml(p), '<g:identifier_exists>no</g:identifier_exists>');
});

t('Kenya shipping: no invented fee, full block once a fee is configured', () => {
  assert.equal(feedShippingXml({ shipping: { country: 'KE', price_kes: null } }), '');
  const xml = feedShippingXml({ shipping: { country: 'KE', service: 'Standard delivery', price_kes: 350, min_handling_time: 0, max_handling_time: 1, min_transit_time: 1, max_transit_time: 3 } });
  assert.ok(xml.includes('<g:country>KE</g:country>') && xml.includes('<g:price>350 KES</g:price>'));
  assert.ok(xml.includes('<g:max_transit_time>3</g:max_transit_time>') && xml.includes('<g:min_handling_time>0</g:min_handling_time>'));
});

t('committed shipping config is Kenya-only', () => {
  const cfg = JSON.parse(readFileSync(new URL('./merchant-feed.config.json', import.meta.url), 'utf8'));
  assert.equal(cfg.shipping.country, 'KE');
});

t('vehicle listings are excluded from the feed', () => {
  assert.equal(feedExcluded('stermont-cars-for-sale'), true);
  assert.equal(feedExcluded('pest-control-fumigation'), false);
});

console.log(`${n} merchant feed tests passed.`);
