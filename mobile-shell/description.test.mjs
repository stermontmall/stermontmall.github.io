// Run: node mobile-shell/description.test.mjs  (tests the pure description helpers inside mobile-shell/app.js)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('/* @desc-start'), src.indexOf('/* @desc-end */'));
assert.ok(block.includes('function splitProductDescription'), 'markers found');
const { splitProductDescription, splitFaq } = new Function(block + '\nreturn { splitProductDescription, splitFaq };')();
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const titles = s => s.map(x => x.title);

const advion = 'Tatua Advion Cockroach Gel Bait (30 g, 4 x 30 g) Tatua Advion is a ready-to-use cockroach gel bait supplied in a 30 g applicator tube. Because only small dots are used, it is neat and precise. KEY FEATURES • Ready-to-use cockroach gel bait • 30 g applicator tube • No mixing needed SPECIFICATIONS • Brand: Tatua • Form: Ready-to-use gel in an applicator tube WHERE IT HELPS Cockroaches hide in tight places. HOW TO USE IT Clean the area first. Apply small dots. BEFORE YOU START • Wipe the cupboards • Fix leaks SAFETY Read the label before use. Wash your hands after use. STORAGE Keep in a cool, dry place. FREQUENTLY ASKED QUESTIONS Why a gel? Cockroaches eat it. It is neat. How much gel should I apply? Use small dots. ORDER Order Tatua Advion Cockroach Gel Bait online, pay by M-Pesa and get delivery to all 47 counties. Questions? WhatsApp +254 748 888 230. PRODUCT BUYING GUIDE: Tatua Advion is listed in the range. WHO MAY NEED THIS PRODUCT: filler. PLANNING FOR USE: filler.';
const s = splitProductDescription(advion);
assert.deepEqual(titles(s), ['Product overview', 'Key features & benefits', 'Specifications & details', 'Uses & applications', 'How to use', 'Before you start', 'Safety information', 'Storage & handling', 'Frequently asked questions', 'Ordering, payment & delivery']); n++;
const all = s.map(x => x.body).join(' ');
ok(all.includes('ready-to-use cockroach gel bait supplied'), 'ready-to-use not cut');
ok(all.includes('small dots are used, it is neat'), '"used" not cut');
ok(all.includes('Read the label before use. Wash'), '"before use" not cut');
ok(all.includes('pay by M-Pesa and get delivery to all 47 counties'), '"get delivery" not cut');
ok(!/BUYING GUIDE|filler/.test(all), 'buying guide boilerplate removed');
ok(!s.some(x => x.title === 'More product information'), 'no generic repeated heading');
ok(s.find(x => x.title === 'Safety information').body.startsWith('Read the label'), 'safety text under Safety');

assert.deepEqual(titles(splitProductDescription('One paragraph of plain text with no labels. It is used daily and it is safe to order. '.repeat(12))), ['Product overview']); n++;
ok(splitProductDescription('').length === 0, 'empty');
assert.deepEqual(titles(splitProductDescription('Intro. SAFETY Wear gloves. STORAGE Keep dry. SAFETY Wash hands.')), ['Product overview', 'Safety information', 'Storage & handling']); n++;
ok(splitFaq('Why a gel? Cockroaches eat it. It is neat. How much? Use small dots.').length === 2, 'faq pairs');
ok(splitFaq('Only one sentence.') === null, 'non faq text');
console.log(`mobile-shell description: ${n} checks passed`);
