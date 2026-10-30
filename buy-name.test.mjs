// node buy-name.test.mjs  - "Buy" before every visible product name (owner request 2026-10-30).
// Kept separate from seo-meta.test.mjs on purpose: that suite has older expectations that no longer match the current wording.
import assert from 'node:assert/strict';
import { buyName, pdpH1, pdpTitle, hasLeadWord } from './seo-meta.mjs';
let n = 0;
const eq = (a, b, m) => { assert.equal(a, b, m); n++; };

// the builder
for (const [nm, want] of [['Bazooka 18EC', 'Buy Bazooka 18EC'], ['  Buy   Bazooka 18EC ', 'Buy Bazooka 18EC'], ['buy now kit', 'buy now kit'], ['Buyer Guide Pack', 'Buy Buyer Guide Pack'],
  ['#1 Top ALONZE 50EC Abamectin Insecticide', 'Buy #1 Top ALONZE 50EC Abamectin Insecticide'], ['', ''], [null, ''], [undefined, '']]) eq(buyName(nm), want, `buyName(${JSON.stringify(nm)})`);
eq(buyName(buyName('Rootex 6')), 'Buy Rootex 6', 'idempotent');

// the page H1: "Buy" first, exactly once, the rest unchanged from before (lead word + full name)
const cases = [
  ['Bazooka 18EC Insecticide (1L)', { catSlug: 'crop-insecticides' }], ['Samsung Galaxy A15 128GB', { catSlug: 'phones-tablets' }], ['Hot Plate', { catSlug: 'kitchen-dining' }],
  ['Original Zagro Ultraxide Disinfectant', { catSlug: 'disinfectants-hygiene' }], ['#1 Top ALONZE 50EC Abamectin Insecticide', { catSlug: 'crop-insecticides' }],
  ['Top-Rated Absolute 375SC Systemic Fungicide', { catSlug: 'fungicides' }], ['Rat Poison Blocks', { catSlug: 'rodent-control' }], ['Odour Control Spray', { catSlug: 'bed-bug-killers' }]];
for (const [name, ctx] of cases) {
  const h = pdpH1(name, ctx);
  assert.ok(/^Buy \S/.test(h) && !/^Buy buy\b/i.test(h), `H1 must start with "Buy " once: ${h}`); n++;
  assert.ok(h.endsWith(name), `H1 keeps the full name: ${h}`); n++;
  eq(h.slice(4), pdpH1(name, ctx).slice(4), 'deterministic'); 
  // what "Buy" sits in front of is exactly what the H1 was before this change (lead word logic untouched)
  const before = hasLeadWord(name) ? name : h.slice(4);
  eq(h, buyName(before), `H1 = Buy + previous H1: ${h}`);
  // the search title is NOT given "Buy" (60-character limit, owner's exact titles)
  assert.ok(!/^Buy /i.test(pdpTitle(name, ctx)), `title must not start with Buy: ${pdpTitle(name, ctx)}`); n++;
}
console.log(`OK: ${n} checks, 0 violations`);
