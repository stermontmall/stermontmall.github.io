// Run: node mobile-shell/packs.test.mjs  (tests the pure pack-size helpers inside mobile-shell/app.js)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('/* @pack-start'), src.indexOf('/* @pack-end */'));
assert.ok(block.includes('function packOptions'), 'markers found');
const { packAmount, packOptions } = new Function(block + '\nreturn { packAmount, packOptions };')();
const z = (label, price, old = 0) => ({ rowId: label, slug: label, label, price, old });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const labels = a => a.map(x => x.label);

ok(packAmount('250 ml').n === 250 && packAmount('1 Litre').n === 1000 && packAmount('5L').n === 5000, 'volume units');
ok(packAmount('25kg').n === 25000 && packAmount('500 g').n === 500, 'weight units');
ok(packAmount('20 pcs').fam === 'cnt' && packAmount('Pack of 20').n === 20, 'count units');
ok(packAmount('3 x 100 ml') === null && packAmount('Standard') === null && packAmount('') === null, 'multipacks and unknown labels are not parsed');

// shown smallest first even though the input is price-sorted differently
let o = packOptions([z('1 Litre', 1800), z('50 ml', 300), z('250 ml', 700), z('100 ml', 450)]);
ok(JSON.stringify(labels(o)) === JSON.stringify(['50 ml', '100 ml', '250 ml', '1 Litre']), 'smallest pack first');
ok(o.filter(x => x.best).length === 1 && o.find(x => x.best).label === '1 Litre', 'one clear best-value size');

// no clear winner (equal per-unit price) -> no tag
o = packOptions([z('100 ml', 100), z('200 ml', 200)]);
ok(!o.some(x => x.best), 'no tag when per-unit prices tie');
// a single size, mixed families, unknown labels -> no tag and price order kept
ok(!packOptions([z('1 Litre', 1000)])[0].best, 'single size has no tag');
o = packOptions([z('Standard', 500), z('100 ml', 200), z('250 ml', 400)]);
ok(JSON.stringify(labels(o)) === JSON.stringify(['Standard', '100 ml', '250 ml']) && !o.some(x => x.best), 'unreadable label keeps given order, no tag');
o = packOptions([z('100 ml', 200), z('1 kg', 400)]);
ok(!o.some(x => x.best), 'mixed families are not compared');
o = packOptions([z('3 x 100 ml', 500), z('100 ml', 200)]);
ok(!o.some(x => x.best), 'multipacks are not compared');
// saving percent comes only from a real old price
o = packOptions([z('100 ml', 200, 250), z('250 ml', 450)]);
ok(o[0].save === 20 && o[1].save === 0, 'save percent');
console.log(`packs tests passed (${n} checks)`);
