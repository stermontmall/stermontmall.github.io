// Tests for price-watch.mjs. Uses small made-up pages, so they check the logic, not the live sites.
// Run: node --test price-watch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseKsh, findPrice, decode, parseJumia, parseEmbeddedJson, parseWoo, parseWooStore, parseGeneric, parsePage, matchScore, pickMatches, assess, median, CFG } from './price-watch.mjs';

const jumiaPage = `
<article class="prd _fb col c-prd"><a class="core" href="/knapsack-sprayer-16l-123.html"><div class="info">
<h3 class="name">Knapsack Sprayer 16L Manual</h3><div class="prc">KSh 2,800</div><div class="old">KSh 3,500</div></div></a></article>
<article class="prd _fb col c-prd"><a class="core" href="/sprayer-nozzle-9.html"><div class="info">
<h3 class="name">Sprayer Nozzle Spare</h3><div class="prc">KSh 250 - KSh 400</div></div></a></article>`;

test('parseKsh handles commas, ranges, junk and encoded currency symbols', () => {
  assert.equal(parseKsh('KSh 2,499'), 2499);
  assert.equal(parseKsh('KSh 1,200 - KSh 1,500'), 1200);
  assert.equal(parseKsh('Ksh2499.00'), 2499);
  assert.equal(parseKsh('out of stock'), null);
  assert.equal(parseKsh('&#75;&#83;&#104;&nbsp;2,500'), 2500);     // the digits inside the entities are not a price
});

test('findPrice reads the usual Kenyan price formats', () => {
  assert.equal(findPrice('Parsley KSh. 93 Add to cart').price, 93);
  assert.equal(findPrice('KSh.3,000').price, 3000);
  assert.equal(findPrice('Price: KES 12,500.00').price, 12500);
  assert.equal(findPrice('2,500 KSh').price, 2500);
  assert.equal(findPrice('Wash 500 ml bottle'), null);              // "sh 500" inside a word is not a currency
  assert.equal(decode('&#75;&#83;&#104;&nbsp;1,900'), 'KSh 1,900');
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

const wooPage = `<ul class="products">
<li class="product type-product status-publish instock"><a href="/product/knapsack-sprayer-16l/"><h2 class="woocommerce-loop-product__title">Knapsack Sprayer 16L</h2>
<span class="price"><del><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#75;&#83;&#104;</span>&nbsp;3,200.00</bdi></span></del>
<ins><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&#75;&#83;&#104;</span>&nbsp;2,750.00</bdi></span></ins></span></a></li>
<li class="product type-product status-publish outofstock"><a href="/product/old/"><h2 class="woocommerce-loop-product__title">Discontinued Pump 20L</h2>
<span class="price"><span class="woocommerce-Price-amount amount"><bdi>KSh&nbsp;900.00</bdi></span></span></a></li>
<li class="product instock"><a href="/product/sanitizer/"><h2 class="woocommerce-loop-product__title">Hand Sanitizer 500ml</h2>
<span class="price"><span class="woocommerce-Price-amount amount"><bdi>350.00&nbsp;<span class="woocommerce-Price-currencySymbol">KSh</span></bdi></span></span></a></li></ul>`;

test('parseWoo takes the sale price, skips old prices and out-of-stock items, decodes the currency symbol', () => {
  const r = parseWoo(wooPage, 'imaginecare', 'https://imaginecare.co.ke');
  assert.deepEqual(r.map(x => [x.name, x.price]), [['Knapsack Sprayer 16L', 2750], ['Hand Sanitizer 500ml', 350]]);
  assert.equal(r[0].url, 'https://imaginecare.co.ke/product/knapsack-sprayer-16l/');
});

test('parseWooStore converts minor units and tells apart other kinds of page', () => {
  const json = JSON.stringify([{ name: 'Knapsack Sprayer 16L', permalink: 'https://x.ke/p/1', is_in_stock: true, prices: { price: '285000', currency_minor_unit: 2 } },
    { name: 'Gone Item', is_in_stock: false, prices: { price: '100000', currency_minor_unit: 2 } }]);
  const r = parseWooStore(json, 'imaginecare');
  assert.deepEqual(r.map(x => [x.name, x.price]), [['Knapsack Sprayer 16L', 2850]]);
  assert.equal(parseWooStore('<html>not json</html>', 'imaginecare'), null);
  assert.deepEqual(parseWooStore('[]', 'imaginecare'), []);
});

const csCartPage = `
<div class="ty-grid-list__item"><a class="product-title" href="/knapsack-sprayer-16l.html">Knapsack Sprayer 16L</a>
<div class="ty-price"><span class="ty-price-num">KSh.</span><span class="ty-price-num">2,900</span></div><a class="ty-btn" href="#">Add to cart</a></div>
<div class="ty-grid-list__item"><a class="product-title" href="/electric-kettle.html">Electric Kettle 1.8L</a>
<span class="ty-price-num">KSh. 1,950</span> <a href="/cart">Add to cart</a></div>
<div class="ty-grid-list__item"><a class="product-title" href="/gone.html">Gone Pump 20L</a><span>Out of stock</span><span>KSh. 100</span></div>
<div class="card"><a href="/seeds/africa-red"><h4>Africa Red F1 Onion Seeds</h4> KSh. 9,500 (VAT inclusive)</a></div>`;

test('parseGeneric pairs each product link with the price that follows it, and skips out-of-stock items', () => {
  const r = parseGeneric(csCartPage, 'agroduka', 'https://agroduka.ke');
  assert.deepEqual(r.map(x => [x.name, x.price]), [['Knapsack Sprayer 16L', 2900], ['Electric Kettle 1.8L', 1950], ['Africa Red F1 Onion Seeds', 9500]]);
  assert.equal(r[0].url, 'https://agroduka.ke/knapsack-sprayer-16l.html');
  assert.equal(parsePage(csCartPage, 'agroduka').length, 3);       // parsePage falls through to the generic reader
  assert.equal(parsePage('<html><body>nothing here</body></html>', 'agroduka').length, 0);
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

const T = { tolerancePct: 10, raiseGapPct: 10, minMarginPct: 10, maxCutPct: 25, maxRaisePct: 25, roundTo: 10, marketBasis: 'median', minMatches: 2 };   // fixed settings for these tests, so editing price-watch.config.json never breaks them
// End-to-end tests run a private copy of the script with its own config, so the live price-watch.config.json (sources, margins) cannot change their results.
const scriptIn = (dir, cfg = {}) => {
  copyFileSync(fileURLToPath(new URL('./price-watch.mjs', import.meta.url)), join(dir, 'price-watch.mjs'));
  writeFileSync(join(dir, 'price-watch.config.json'), JSON.stringify({ ...T, sources: ['jumia', 'kilimall', 'agroduka', 'imaginecare'], autoApply: true, ...cfg }));
  return join(dir, 'price-watch.mjs');
};
const mk = (prices) => prices.map(price => ({ source: 'jumia', name: 'x', price }));

test('clearly above market: suggests the market price, keeps margin', () => {
  const a = assess({ price: 3500, cost: 2000 }, mk([2800, 2900]), T);
  assert.equal(a.status, 'above');
  assert.equal(a.direction, 'cut');
  assert.equal(a.target, 2850);                       // median 2850, rounded up to 10
  assert.ok(a.marginPct >= T.minMarginPct);
  assert.ok(a.trusted);
});

test('never cuts below the minimum margin', () => {
  const a = assess({ price: 3500, cost: 2900 }, mk([2800, 2900]), T);
  assert.equal(a.target, 3190);                       // cost 2900 x 1.10 = 3190 exactly: a 10% margin, already a multiple of 10
  assert.ok(a.marginPct >= T.minMarginPct - 1e-6);
});

test('limits a single cut to maxCutPct', () => {
  const a = assess({ price: 6000, cost: 1000 }, mk([2000, 2000]), T);
  assert.equal(a.target, 4500);                       // 25% cut at most
  assert.match(a.note, /limited/);
});

test('no cost on file: a cut is reported but never given a price', () => {
  const a = assess({ price: 3500, cost: 0 }, mk([2800, 2900]), T);
  assert.equal(a.status, 'above');
  assert.equal(a.target, undefined);
  assert.ok(a.blocked);
});

test('well under market: raises toward the market price, never above it', () => {
  const a = assess({ price: 2600, cost: 1500 }, mk([2800, 2900]), T);   // market 2850, we are 8.8% under: still in line
  assert.equal(a.status, 'ok');
  const b = assess({ price: 2400, cost: 1500 }, mk([2800, 2900]), T);   // 15.8% under
  assert.equal(b.status, 'below');
  assert.equal(b.direction, 'raise');
  assert.equal(b.target, 2850);                                      // market median, rounded down, so never above the market
  assert.ok(b.target <= 2850);
});

test('a raise is limited to maxRaisePct per run and needs no cost on file', () => {
  const a = assess({ price: 1200, cost: 0 }, mk([1950, 1950]), T);
  assert.equal(a.status, 'below');
  assert.equal(a.target, 1500);                                      // +25% at most
  assert.match(a.note, /limited/);
  assert.equal(a.marginPct, null);
});

test('lowest basis: follows the cheapest listing exactly, no rounding, no tolerance', () => {
  const L = { ...T, marketBasis: 'lowest', roundTo: 1, tolerancePct: 0, raiseGapPct: 0 };
  const cut = assess({ price: 3500, cost: 2000 }, mk([2899, 2975, 3100]), L);
  assert.equal(cut.market, 2899);
  assert.equal(cut.direction, 'cut');
  assert.equal(cut.target, 2899);                                    // exact, not 2900 and not the median
  const raise = assess({ price: 2400, cost: 1500 }, mk([2899, 2975, 3100]), L);
  assert.equal(raise.direction, 'raise');
  assert.equal(raise.target, 2899);                                  // never above the lowest listing
  assert.equal(assess({ price: 2899, cost: 1500 }, mk([2899, 2975]), L).status, 'ok');   // already exactly at the lowest
  const floor = assess({ price: 4000, cost: 2900 }, mk([2800, 2900]), { ...L, minMarginPct: 25 });
  assert.equal(floor.target, 3625);                                  // still never below cost + margin
});

test('no per-run cap: a big gap goes straight to the lowest listing', () => {
  const L = { ...T, marketBasis: 'lowest', roundTo: 1, tolerancePct: 0, raiseGapPct: 0, maxCutPct: 100, maxRaisePct: 10000 };
  assert.equal(assess({ price: 6000, cost: 1000 }, mk([2000, 2500]), L).target, 2000);   // -67% in one go
  assert.equal(assess({ price: 1200, cost: 0 }, mk([3000, 3500]), L).target, 3000);      // +150% in one go
});

test('range basis: one site is matched exactly, several sites keep us inside their range, cost is ignored', () => {
  const R = { ...T, marketBasis: 'range', roundTo: 1, tolerancePct: 0, raiseGapPct: 0, maxCutPct: 100, maxRaisePct: 10000, useCost: false, minMatches: 1 };
  const J = (price, source = 'jumia') => ({ source, name: 'x', price });
  // Jumia has many sellers: only the cheapest counts, so 2899 (not 3100) is the Jumia price
  assert.equal(assess({ price: 3500, cost: 0 }, [J(3100), J(2899), J(2975)], R).target, 2899);
  assert.equal(assess({ price: 2400, cost: 9999 }, [J(3100), J(2899)], R).target, 2899);   // cost is ignored
  // two sites at 2899 (Jumia) and 3300 (shop): inside the range = leave alone, above = down to the top, below = up to the bottom
  const two = [J(3100), J(2899), J(3300, 'shop')];
  assert.equal(assess({ price: 3000, cost: 0 }, two, R).status, 'ok');
  assert.equal(assess({ price: 4000, cost: 0 }, two, R).target, 3300);
  assert.equal(assess({ price: 2500, cost: 0 }, two, R).target, 2899);
  assert.equal(assess({ price: 3300, cost: 0 }, two, R).status, 'ok');
});

test('within tolerance is ok, one listing is not trusted, no listings is nomatch', () => {
  assert.equal(assess({ price: 3000, cost: 2000 }, mk([2800, 2900]), T).status, 'ok');
  assert.equal(assess({ price: 3500, cost: 2000 }, mk([2800]), T).trusted, false);
  assert.equal(assess({ price: 3500, cost: 2000 }, [], T).status, 'nomatch');
  assert.equal(median([3, 1, 2]), 2);
});

// End to end: the real script run against saved pages (no internet, no Supabase). Kilimall has no saved page, so it must be reported as unreadable.
test('end to end: four sources, cuts and raises are found, a missing source is flagged, report-only changes nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-'));
  writeFileSync(join(dir, 'products.json'), JSON.stringify([
    { id: 'a1', name: 'Knapsack Sprayer 16L', price: 3500, cost: 2000, old_price: 4200 },
    { id: 'b2', name: 'Electric Kettle 1.8L', price: 1200, cost: 800, old_price: 1500 },
    { id: 'c3', name: 'Rare Gadget 9000', price: 5000, cost: 3000 },
  ]));
  writeFileSync(join(dir, 'jumia.html'), jumiaPage.replace('Sprayer Nozzle Spare', 'Electric Kettle 1.8L').replace('KSh 250 - KSh 400', 'KSh 1,900'));
  writeFileSync(join(dir, 'agroduka.html'), csCartPage);
  writeFileSync(join(dir, 'imaginecare.json'), JSON.stringify([
    { name: 'Knapsack Sprayer 16L', is_in_stock: true, prices: { price: '285000', currency_minor_unit: 2 } },
    { name: 'Electric Kettle 1.8L', is_in_stock: true, prices: { price: '195000', currency_minor_unit: 2 } }]));
  const script = scriptIn(dir);
  const run = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8', env: { ...process.env, PRODUCTS_JSON: join(dir, 'products.json'), FIXTURE_DIR: dir, APPLY: '0', SUPABASE_SERVICE_KEY: '' } });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Kilimall returned no readable listings/);
  assert.match(run.stdout, /\*\*1\*\* clearly above market, \*\*1\*\* clearly under market/);
  assert.match(run.stdout, /report-only/);
  const csv = readFileSync(join(dir, 'price-watch.csv'), 'utf8');
  assert.match(csv, /"a1","Knapsack Sprayer 16L","above","3500","2000","2850","\d+\.\d","2850","",/);   // cut to the market median
  assert.match(csv, /"b2","Electric Kettle 1.8L","below","1200","800","1950","-38\.\d","1500","",/);    // raise capped at +25%
  assert.match(csv, /"c3","Rare Gadget 9000","nomatch"/);
});

// Apply path against a fake Supabase: the change goes out with the right filters and body, a price edited meanwhile is skipped,
// and the backup file is written first.
test('apply: sends guarded updates, skips a price changed meanwhile, writes the backup', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-apply-'));
  writeFileSync(join(dir, 'products.json'), JSON.stringify([
    { id: 'a1', name: 'Knapsack Sprayer 16L', price: 3500, cost: 2000, old_price: 4200 },
    { id: 'b2', name: 'Electric Kettle 1.8L', price: 1200, cost: 800, old_price: 1500 },
  ]));
  writeFileSync(join(dir, 'jumia.html'), jumiaPage.replace('Sprayer Nozzle Spare', 'Electric Kettle 1.8L').replace('KSh 250 - KSh 400', 'KSh 1,900'));
  writeFileSync(join(dir, 'agroduka.html'), csCartPage);
  const calls = [];
  const server = createServer((req, res) => {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: JSON.parse(body || '{}') });
      res.setHeader('content-type', 'application/json');
      res.end(req.url.includes('id=eq.a1') ? '[{"id":"a1"}]' : '[]');      // b2 "was edited by hand": the price filter matches nothing
    });
  });
  await new Promise(r => server.listen(0, r));
  const script = scriptIn(dir);
  const out = await new Promise(resolve => {
    const c = spawn(process.execPath, [script], { cwd: dir, env: { ...process.env, PRODUCTS_JSON: join(dir, 'products.json'), FIXTURE_DIR: dir, APPLY: '1', SUPABASE_SERVICE_KEY: 'svc-test', SUPABASE_URL: `http://127.0.0.1:${server.address().port}` } });
    let o = ''; c.stdout.on('data', d => o += d); c.on('close', code => resolve({ code, o }));
  });
  server.close();
  assert.equal(out.code, 0);
  assert.equal(calls.length, 2);
  const a1 = calls.find(c => c.url.includes('id=eq.a1')), b2 = calls.find(c => c.url.includes('id=eq.b2'));
  assert.equal(a1.method, 'PATCH');
  assert.equal(a1.auth, 'Bearer svc-test');
  assert.match(a1.url, /price=eq\.3500/);                                  // only if the price is still what we read
  assert.deepEqual(a1.body, { price: 2850 });                              // old "was" price 4200 is still above it: untouched
  assert.deepEqual(b2.body, { price: 1500, old_price: null });             // "was" price 1500 would not be above the new price: cleared
  assert.match(out.o, /Changed \*\*1\*\* price/);
  assert.match(out.o, /cut \*\*Knapsack Sprayer 16L\*\*: KSh 3,500 → KSh 2,850/);
  assert.match(out.o, /skipped \*\*Electric Kettle 1.8L\*\*/);
  assert.match(readFileSync(join(dir, 'price-watch-backup.csv'), 'utf8'), /"a1","Knapsack Sprayer 16L","3500","2850","4200"/);
});

test('apply without the service key changes nothing and says why', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-nokey-'));
  writeFileSync(join(dir, 'products.json'), JSON.stringify([{ id: 'a1', name: 'Knapsack Sprayer 16L', price: 3500, cost: 2000 }]));
  writeFileSync(join(dir, 'jumia.html'), jumiaPage);
  writeFileSync(join(dir, 'agroduka.html'), csCartPage);
  const script = scriptIn(dir);
  const run = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8', env: { ...process.env, PRODUCTS_JSON: join(dir, 'products.json'), FIXTURE_DIR: dir, APPLY: '', SUPABASE_SERVICE_KEY: '' } });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /SUPABASE_SERVICE_KEY secret is not set, so nothing was changed/);
});
