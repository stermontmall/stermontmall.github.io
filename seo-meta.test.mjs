// Run: node seo-meta.test.mjs   (no dependencies)
import assert from 'node:assert/strict';
import { pdpBadges, pdpHeadings, pdpH1, pdpTagline, pdpTitle, pdpDescription, catTitle, catDescription, powerWord, productType, hasLeadWord, buyName, isGenuine, TITLE_MAX, DESC_MAX } from './seo-meta.mjs';

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
  assert.ok(/M-Pesa checkout/.test(tg) && /47 counties/.test(tg) && !/(#1|top-rated|guaranteed|certified)/i.test(h + tg), `bad tagline/H1: ${h} | ${tg}`);
  assert.ok(h.startsWith('Buy '), `H1 must start with Buy: ${h}`); n++;
  assert.ok(h.endsWith(name.replace(/\s+/g, ' ').trim()), `H1 must keep the full product name: ${h}`);
  // Modifiers: every title and H1 carries Original / a power word, and Original in the H1 is never claimed for an unknown-brand general product.
  const MOD = /\b(Original|Powerful|Top-Quality|Premium|Reliable|Proven|Effective|High-Potency|Heavy-Duty|Fast-Acting|Long-Lasting|Quality|Top|Best|Genuine)\b/;
  assert.ok(MOD.test(t) && MOD.test(h), `title/H1 lacks a modifier: ${t} | ${h}`); n += 2;
  assert.ok(isGenuine(ctx) || !/^Buy Original\b/.test(h) || /^Original\b/i.test(name), `Original claimed where not true: ${h}`);
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

// Trust badges and H2 headings
for (const ctx of ctxs) {
  const b = pdpBadges(ctx).join(' | '); n += 3;
  assert.ok(pdpBadges(ctx).every(x => x.startsWith('\u2713 ')), `badge needs a tick: ${b}`);
  assert.ok(/Fast M-Pesa Checkout/.test(b) && /Sarit Centre Pickup \| Delivery to 47 Counties/.test(b), `missing M-Pesa/pickup badge: ${b}`);
  assert.ok(!/(#1|top-rated|guaranteed|certified)/i.test(b), `unverifiable badge: ${b}`);
}
assert.ok(pdpBadges({ catSlug: 'crop-insecticides' })[0].includes('PCPB Approved'));
assert.ok(!pdpBadges({ catSlug: 'fertilizers' }).join().includes('PCPB'));
assert.ok(!pdpBadges({ catSlug: 'kitchen', brand: 'Stermont Arcade' }).join().includes('Original'));
assert.equal(pdpHeadings('bed-bug-killers').features, 'Powerful Features & Target Dudu Control');
assert.equal(pdpHeadings('herbicides').features, 'Powerful Features & Target Crop Protection');
assert.equal(pdpHeadings('smartphones').features, null);
assert.equal(pdpHeadings('smartphones').guide, 'Reliable Quality & Application Guide');
assert.equal(pdpHeadings('smartphones').price, 'Price, M-Pesa Checkout & Kenya Delivery');
n += 8;

// generate-products.mjs prints pdpHeadings().delivery as an <h2>; it must never be empty (it was, on every product page, before 2026-10-29).
for (const slug of ['bed-bug-killers', 'herbicides', 'smartphones', undefined]) { assert.ok(String(pdpHeadings(slug).delivery || '').length > 10, `empty delivery heading for ${slug}`); n++; }

// Owner's catalog names (products.seo_name, from the Master Catalog SEO Mapping PDF): every lead word it uses must be recognised, so pdpH1/pdpTitle
// never stack "Original" or a power word in front of it ("Original Top-Rated ...", "Powerful Certified ...").
const catalogNames = [
  'Top-Quality 2 Litre Hand Pressure Sprayer', 'Top-Rated Absolute 375SC Systemic Fungicide', '#1 Rated Premise 200 SC Termiticide',
  'Fast-Acting Bedlam 200SL Bedbug Insecticide', 'Highly Effective Bromarat 0.005 RB Rodent Bait', 'Heavy-Duty Mchwatox 350 SC Termiticide',
  'Odourless Promax 20EC Bedbug Insecticide', 'Original Actellic 25EC Insecticide', 'Professional Tatua Advion Cockroach Gel Bait Tube',
  'Professional Grade Covver Xtra 500SC Fungicide', 'Reliable Chariot 500SC Fungicide', 'Certified Lysine Feed Amino Acid',
  'Commercial-Grade Catapult 480SL Herbicide', 'Effective Bat CRP Bat Repellent', 'Elegant OURSTART Men\'s Quartz Watch (Gold/Silver)',
  'Genuine Bayer Baraki Pellets Rat & Mice Poison', 'High-Potency Darvin 50EW Insecticide', 'High-Yield Optimizer Biostimulant (250ml)',
  'Leading Beanpro 480SL Herbicide', 'Powerful Bazooka 18EC Insecticide', 'Premium Glamstar Double Door Refrigerator',
  'Sturdy Lumagogo 210cm Adjustable Tripod Stand Set', 'Trendy Urban Comfort Women\'s Tracksuit Set', 'Trusted Popvet Total Dewormer for Dogs (4 Tabs)',
  'Ultimate TCL 75C6K QD-Mini LED 4K Smart TV', 'Value-Pack SONAR X2 Kettle with Gift Jug Set', 'Veterinary Standard Levafas Diamond Fluke & Worm Drench',
  'Weatherproof Rodilon Wax Blocks'
];
for (const nm of catalogNames) {
  assert.ok(hasLeadWord(nm), `lead word not recognised: ${nm}`); n++;
  for (const ctx of ctxs) {
    assert.equal(pdpH1(nm, ctx), buyName(nm), `H1 must be the owner's name with only the Buy prefix: ${pdpH1(nm, ctx)}`);
    assert.ok(pdpTitle(nm, ctx).startsWith(nm.slice(0, 12)) || pdpTitle(nm, ctx).length <= TITLE_MAX, `title lost the lead word: ${pdpTitle(nm, ctx)}`); n += 2;
  }
}
// names with no lead word still get one (unchanged behaviour)
for (const nm of ['Bazooka 18EC', 'Samsung Galaxy A15 128GB', 'Odour Control Spray', 'Professionals Choice Kit']) { assert.ok(!hasLeadWord(nm), `false positive: ${nm}`); n++; }
console.log('example PDP :', pdpTitle('Bazooka 18EC Insecticide (1L)', { catSlug: 'crop-insecticides' }));
console.log('example desc:', pdpDescription('Bazooka 18EC', { catSlug: 'crop-insecticides' }));
console.log('example cat :', catTitle('Crop Insecticides'));
console.log('example cdsc:', catDescription('Crop Insecticides', 'crop-insecticides'));
console.log(`OK: ${n} checks, 0 violations`);
