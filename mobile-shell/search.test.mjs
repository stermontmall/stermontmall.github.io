// Search engine checks. Run: node mobile-shell/search.test.mjs
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('/* @search-start'), src.indexOf('/* @search-end */'));
const searchProducts = new Function(block + '; return searchProducts;')();
const items = [
  ['Sevin Dudu Dust 200g'], ['Fountain Aerator 1.5HP'], ['Rat Kill Pellets 600g'], ['Cyfaza Mouse Traps 4 Pack'], ['Tatua Advion Cockroach Gel Bait 30g'],
  ['K-Othrine EC 15 Insecticide 1L'], ['Kungunil 200SL Insecticide 100ml'], ['Kungunil 200SL Insecticide 1L'], ['Jacto XP Knapsack Sprayer 16L'],
  ['Hisense 43A6QKEN 4K UHD Smart TV 43 Inch'], ['Samsung Galaxy A06 4GB RAM 64GB'], ['Termidor 96SC Termiticide'], ['DAP 18-46-0 Planting Fertilizer 50kg'],
  ['10W UV Fly Killer Replacement Lamps'], ['Respirator Mask With Goggles']
].map(([name], i) => ({ name, i, sub: '', catName: i === 0 ? 'Pest Control' : '', keys: name.startsWith('Termidor') ? ['200 ml', '1 Litre'] : [] }));
let pass = 0, fail = 0;
const top = q => searchProducts(items, q).list.map(r => r.p.name);
const check = (label, ok, info) => { if (ok) pass++; else { fail++; console.log('FAIL', label, info || ''); } };
const has = (q, text) => check(`"${q}" finds ${text}`, top(q).some(n => n.includes(text)), top(q).join(' | '));
const first = (q, text) => check(`"${q}" ranks ${text} first`, (top(q)[0] || '').includes(text), top(q).join(' | '));
first('rat', 'Rat Kill'); check('"rat" does not match inside "Aerator"', !top('rat').some(n => n.includes('Aerator')), top('rat').join(' | '));
has('sprayers', 'Jacto'); has('knapsak sprayer', 'Jacto'); has('cockroch gel', 'Cockroach'); has('mende', 'Cockroach'); has('dawa ya mende', 'Cockroach'); has('panya', 'Mouse'); has('mchwa', 'Termidor');
has('kothrine', 'K-Othrine'); has('k othrine', 'K-Othrine'); has('K-Othrine', 'K-Othrine');
first('kungunil 1 litre', 'Insecticide 1L'); has('kungunil 100 ml', '100ml'); has('termidor 1l', 'Termidor');
has('television', 'Hisense'); has('43 inch tv', 'Hisense'); has('fertiliser', 'DAP'); has('18-46-0', 'DAP'); has('samsung a06', 'A06'); has('buy rat pellets in kenya', 'Rat Kill');
check('unknown word returns nothing', top('zzzzqqq').length === 0, top('zzzzqqq').join());
check('symbols only return nothing', top('!!! ***').length === 0);
check('"constructor" does not crash', Array.isArray(top('constructor toString')));
const near = searchProducts(items, 'jacto sprayer purple');
check('closest matches when one word is missing', near.relaxed && near.list[0].p.name.includes('Jacto'));
check('numbers are not typo-matched', top('999999').length === 0);
console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
