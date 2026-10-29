// Run: node seo-meta.test.mjs   (no dependencies)
import assert from 'node:assert/strict';
import { pdpH1, pdpTagline, pdpTitle, pdpDescription, catTitle, catDescription, powerWord, productType, TITLE_MAX, DESC_MAX } from './seo-meta.mjs';

const names = [
  'Bazooka 18EC Insecticide (1L)', 'Bazooka 18EC', 'Duduthrin 1.75EC Insecticide 1 Litre', 'Roundup Turbo 500ml',
  'Ridomil Gold MZ 68 WG Fungicide 1kg', 'Cypermethrin 10% EC Commercial Pest Control Concentrate 5 Litres',
  'Sumithion Bed Bug Killer Spray', 'Ultimate Rat Bait Blocks 500g Heavy Duty Rodent Control Station Pack',
  'Samsung Galaxy A15 128GB', 'Hotpoint Microwave 20L', 'DAP Fertilizer 50kg', 'Original Duduthrin 1.75EC 250ml',
  'Powerful Termite Killer 1L', 'A', 'Kitchen Storage Container Set of 12 Pieces With Lids Large'
];
const ctxs = [
  { catSlug: 'crop-insecticides', brand: 'Twiga' }, { catSlug: 'herbicides' }, { catSlug: 'bed-bug-killers' },
  { catSlug: 'rodent-control' }, { catSlug: 'fertilizers' }, { catSlug: 'smartphones', brand: 'Samsung' },
  { catSlug: 'kitchen', brand: 'Stermont Arcade' }, {}
];
const cats = [['Crop Insecticides', 'crop-insecticides'], ['Bed Bug Killers', 'bed-bug-killers'], ['Smartphones', 'smartphones'],
  ['Adjuvants & Growth Regulators', 'adjuvants-growth-regulators'], ['Home & Kitchen Appliances', 'home-kitchen']];

let n = 0;
for (const name of names) for (const ctx of ctxs) {
  const t = pdpTitle(name, ctx), d = pdpDescription(name, ctx); n += 2;
  assert.ok(t.length <= TITLE_MAX, `title ${t.length}: ${t}`);
  assert.ok(d.length <= DESC_MAX, `desc ${d.length}: ${d}`);
  assert.ok(/Price in Kenya/.test(t), `title lacks Price in Kenya: ${t}`);
  assert.ok(/M-Pesa/.test(d) && /Kenya/.test(d), `desc lacks M-Pesa/Kenya: ${d}`);
  assert.ok(!/PCPB/i.test(t + d), `PDP must not claim PCPB: ${t} | ${d}`);
  assert.ok(!/(#1|top-rated|guaranteed|certified)/i.test(t + d), `unverifiable claim: ${t} | ${d}`);
  assert.ok(!/\b(\w+(?:-\w+)?) \1\b/i.test(t), `repeated word: ${t}`);
  assert.equal(t, pdpTitle(name, ctx), 'title must be deterministic');
  const h = pdpH1(name, ctx), tg = pdpTagline(ctx); n += 3;
  assert.ok(!/\b(\w+(?:-\w+)?) \1\b/i.test(h), `repeated word in H1: ${h}`);
  assert.ok(/Best Price in Kenya/.test(tg) && !/(#1|top-rated|guaranteed|certified)/i.test(h + tg), `bad tagline/H1: ${h} | ${tg}`);
  assert.ok(h.endsWith(name.replace(/\s+/g, ' ').trim()), `H1 must keep the full product name: ${h}`);
}
for (const [c, slug] of cats) {
  const t = catTitle(c), d = catDescription(c, slug); n += 2;
  assert.ok(t.length <= TITLE_MAX, `cat title ${t.length}: ${t}`);
  assert.ok(d.length <= DESC_MAX, `cat desc ${d.length}: ${d}`);
  const regulated = /PCPB/.test(d);
  assert.equal(regulated, ['crop-insecticides', 'bed-bug-killers', 'adjuvants-growth-regulators'].includes(slug), `PCPB claim wrong for ${slug}: ${d}`);
}
assert.equal(productType('bed-bug-killers'), 'pest'); assert.equal(productType('herbicides'), 'agro');
assert.equal(productType('fertilizers'), 'farm'); assert.equal(productType('smartphones'), 'general');
const leads = new Set(names.map(x => powerWord(x, { catSlug: 'crop-insecticides' })));
assert.ok(leads.size >= 3, `expected variety of power words, got ${[...leads]}`);
console.log('example PDP :', pdpTitle('Bazooka 18EC Insecticide (1L)', { catSlug: 'crop-insecticides' }));
console.log('example desc:', pdpDescription('Bazooka 18EC', { catSlug: 'crop-insecticides' }));
console.log('example cat :', catTitle('Crop Insecticides'));
console.log('example cdsc:', catDescription('Crop Insecticides', 'crop-insecticides'));
console.log(`OK: ${n} checks, 0 violations`);
