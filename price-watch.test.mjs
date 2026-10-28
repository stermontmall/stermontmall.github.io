// Tests for price-watch.mjs. Uses small made-up pages, so they check the logic, not the live sites.
// Run: node --test price-watch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKsh, parseJumia, parseEmbeddedJson, matchScore, pickMatches, assess, median, CFG } from './price-watch.mjs';

const jumiaPage = `
<article class="prd _fb col c-prd"><a class="core" href="/knapsack-sprayer-16l-123.html"><div class="info">
<h3 class="name">Knapsack Sprayer 16L Manual</h3><div class="prc">KSh 2,800</div><div class="old">KSh 3,500</div></div></a></article>
<article class="prd _fb col c-prd"><a class="core" href="/sprayer-nozzle-9.html"><div class="info">
<h3 class="name">Sprayer Nozzle Spare</h3><div class="prc">KSh 250 - KSh 400</div></div></a></article>`;

test('parseKsh handles commas, ranges and junk', () => {
  assert.equal(parseKsh('KSh 2,499'), 2499);
  assert.equal(parseKsh('KSh 1,200 - KSh 1,500'), 1200);
  assert.equal(parseKsh('Ksh2499.00'), 2499);
  assert.equal(parseKsh('out of stock'), null);
});

test('parseJumia reads name, lowest price and link', () => {
  const r = parseJumia(jumiaPage);
  assert.equal(r.length, 2);
  assert.deepEqual([r[0].name, r[0].price], ['Knapsack Sprayer 16L Manual', 2800]);
  assert.equal(r[0].url, 'https://www.jumia.co.ke/knapsack-sprayer-16l-123.html');
  assert.equal(r[1].price, 250);
});

test('parseEmbeddedJson reads JSON-LD and state blobs', () => {
  const html = `<script type="application/ld+json">{"@type":"ItemList","itemListElement":[{"item":{"name":"Knapsack Sprayer 16 Litre","offers":{"price":"2650"}}}]}</script>
  <script>window.__STATE__ = {"list":[{"title":"Electric Kettle 1.8L","salePrice":1900}]};</script>`;
  const r = parseEmbeddedJson(html);
  assert.deepEqual(r.map(x => x.price).sort(), [1900, 2650]);
});

test('matching requires the same sizes and most words', () => {
  const p = { name: 'Knapsack Sprayer 16L', variant_label: '' };
  assert.ok(matchScore(p, { name: 'Manual Knapsack Sprayer 16 Litre' }) >= 0.75);
  assert.equal(matchScore(p, { name: 'Knapsack Sprayer 20L' }), 0);          // wrong size
  assert.ok(matchScore(p, { name: 'Sprayer Nozzle Spare' }) < 0.75);         // accessory
});

test('accessories and bundles far from our price are ignored', () => {
  const p = { name: 'Knapsack Sprayer 16L', price: 3500 };
  const m = pickMatches(p, [{ source: 'jumia', name: 'Knapsack Sprayer 16L', price: 300 }, { source: 'jumia', name: 'Knapsack Sprayer 16L', price: 2800 }]);
  assert.equal(m.length, 1);
});

const mk = (prices) => prices.map(price => ({ source: 'jumia', name: 'x', price }));

test('clearly above market: suggests the market price, keeps margin', () => {
  const a = assess({ price: 3500, cost: 2000 }, mk([2800, 2900]));
  assert.equal(a.status, 'above');
  assert.equal(a.target, 2850);                       // median 2850, rounded up to 10
  assert.ok(a.marginPct >= CFG.minMarginPct);
  assert.ok(a.trusted);
});

test('never cuts below the minimum margin', () => {
  const a = assess({ price: 3500, cost: 2900 }, mk([2800, 2900]));
  assert.equal(a.target, 3200);                       // cost 2900 x 1.10 = 3190, rounded up to the next 10
});

test('limits a single cut to maxCutPct', () => {
  const a = assess({ price: 6000, cost: 1000 }, mk([2000, 2000]));
  assert.equal(a.target, 4500);                       // 25% cut at most
  assert.match(a.note, /limited/);
});

test('no cost on file: reported but never given a price', () => {
  const a = assess({ price: 3500, cost: 0 }, mk([2800, 2900]));
  assert.equal(a.status, 'above');
  assert.equal(a.target, undefined);
  assert.ok(a.blocked);
});

test('within tolerance is ok, far under market is flagged as room to raise, one listing is not trusted', () => {
  assert.equal(assess({ price: 3000, cost: 2000 }, mk([2800, 2900])).status, 'ok');
  assert.equal(assess({ price: 2000, cost: 1500 }, mk([2800, 2900])).status, 'below');
  assert.equal(assess({ price: 3500, cost: 2000 }, mk([2800])).trusted, false);
  assert.equal(assess({ price: 3500, cost: 2000 }, []).status, 'nomatch');
  assert.equal(median([3, 1, 2]), 2);
});
