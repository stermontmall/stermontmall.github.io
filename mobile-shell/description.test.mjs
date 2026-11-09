// Run: node mobile-shell/description.test.mjs  (tests the pure description helpers inside mobile-shell/app.js)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('/* @desc-start'), src.indexOf('/* @desc-end */'));
assert.ok(block.includes('function splitProductDescription'), 'markers found');
const { splitProductDescription, splitFaq, parseSpecs, splitSteps, splitParagraphs, splitLabel, parseBoxItem, pickFacts, splitNumbered, headingCase } = new Function(block + '\nreturn { splitProductDescription, splitFaq, parseSpecs, splitSteps, splitParagraphs, splitLabel, parseBoxItem, pickFacts, splitNumbered, headingCase };')();
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
// spec table: only when every bullet is "Label: value"
assert.deepEqual(parseSpecs(['Brand: Tatua', 'Form: Ready-to-use gel: tube']), [['Brand', 'Tatua'], ['Form', 'Ready-to-use gel: tube']]); n++;
ok(parseSpecs(['Brand: Tatua', 'No label here']) === null && parseSpecs(['Brand: Tatua']) === null, 'mixed or single rows stay a list');
// numbered steps need at least two sentences
ok(splitSteps('Clean first. Apply dots. Check later.').length === 3 && splitSteps('One sentence only.') === null, 'steps');

// ---- headings that really occur in the live catalogue (survey 2026-11-09): none may leak a word into the neighbouring section ----
const body = (secs, t) => (secs.find(x => x.title === t) || {}).body;
const hisense = splitProductDescription("Hisense HMC6MBK 7-in-1 Electric Pressure Cooker (1000W) Simplify your cooking. KEY FEATURES • 7 programs: pressure cook, slow cook • Large capacity: a spacious bowl SPECIFICATIONS • Brand: Hisense • Model: HMC6MBK WHAT'S IN THE BOX • 1 x pressure cooker main unit • 1 x steam tray GOOD FOR • Busy families • Meal prep ORDER Order the Hisense online. PRODUCT BUYING GUIDE: filler. ORDER CHECKLIST: filler.");
assert.deepEqual(titles(hisense), ['Product overview', 'Key features & benefits', 'Specifications & details', "What's in the box", 'Uses & applications', 'Ordering, payment & delivery']); n++;
ok(body(hisense, "What's in the box").startsWith('• 1 x pressure cooker') && !/GOOD FOR/.test(body(hisense, "What's in the box")), 'box list stops before GOOD FOR');
const leak = (text, title, must, mustNot) => { const s = splitProductDescription(text); const b = body(s, title); ok(b && b.startsWith(must) && !mustNot.test(s.map(x => x.body).join(' ')), `${title}: no leaked heading words`); };
leak('Intro. KEY BENEFITS • Fast • Safe', 'Key features & benefits', '•', /\bKEY\b/);
leak('Intro. KEY SPECIFICATIONS & FEATURES • Brand: X • Model: Y', 'Specifications & details', '•', /\bKEY\b|& FEATURES/);
leak('Intro. SAFETY & RE-ENTRY PRECAUTIONS Keep out. STORAGE Dry.', 'Safety information', 'Keep out', /RE-ENTRY|\bRE\b/);
leak('Intro. HANDLING & STORAGE Keep cool.', 'Storage & handling', 'Keep cool', /& STORAGE/);
leak('Intro. MIXING & APPLICATION INSTRUCTIONS Mix 5 ml per litre. Spray evenly.', 'Mixing & application', 'Mix 5 ml', /INSTRUCTIONS/);
leak('Intro. PRODUCT DETAILS TO CONFIRM • Pack size • Model', 'Details to confirm', '•', /TO CONFIRM/);
// ORDER CHECKLIST is its own section and must not be eaten by the plain ORDER heading
const chk = splitProductDescription('Intro text here. ORDER CHECKLIST: Verify the pack size. ORDER Order online today.');
assert.deepEqual(titles(chk), ['Product overview', 'Important buying notes', 'Ordering, payment & delivery']); n++;
ok(body(chk, 'Important buying notes').startsWith('Verify the pack size'), 'checklist body');
// paragraphs: sentences are grouped (no one-sentence paragraphs), blank lines always split, nothing is lost
const para = splitParagraphs('One short. Two short. Three short. Four short. Five short.\n\nNew paragraph here.');
ok(para.length === 3 && para[2] === 'New paragraph here.' && para.join(' ').includes('Five short.'), 'paragraphs grouped by three sentences, blank line splits');
ok(splitParagraphs('A' + 'a'.repeat(199) + '. B' + 'b'.repeat(199) + '.').length === 2, 'long sentences split by length');
// bold label, box quantity, at-a-glance facts
assert.deepEqual(splitLabel('Large capacity: a spacious bowl'), { label: 'Large capacity', text: 'a spacious bowl' }); n++;
ok(splitLabel('No colon here') === null && splitLabel('Ends with colon:') === null, 'label needs text after the colon');
assert.deepEqual(parseBoxItem('1 x rice spoon and measuring cup'), { qty: '1', text: 'rice spoon and measuring cup' }); n++;
ok(parseBoxItem('User manual') === null, 'box item without quantity');
assert.deepEqual(pickFacts([['Brand', 'Hisense'], ['Model', 'HMC6MBK'], ['Power', '1000W'], ['Colour', 'Black'], ['Appliance type', 'Cooker']]).map(r => r[0]), ['Brand', 'Model', 'Power', 'Colour']); n++;
ok(pickFacts([['Brand', 'X'], ['Description', 'a very long value that is certainly longer than the limit']]).length === 0, 'fewer than two short facts -> no strip');
ok(pickFacts([['Brand', 'A'], ['Model', 'B'], ['Power', 'C']]).length === 2, 'three facts are trimmed to two so the grid stays even');

// ---- product-specific headings (generic ALL-CAPS detection) ----
const cook = splitProductDescription("Hisense Cooker (1000W) Simplify cooking. WHAT'S IN THE BOX • 1 x main unit • 1 x manual and warranty guide SEVEN WAYS TO COOK Instead of many pots, use one. SAVE TIME AND ENERGY Pressure cooking is quick. SAFE TO USE Always follow the manual. EASY CLEAN-UP The pot wipes clean.");
assert.deepEqual(titles(cook), ['Product overview', "What's in the box", 'Seven ways to cook', 'Save time and energy', 'Safe to use', 'Easy clean-up']); n++;
ok(!/SEVEN|SAVE TIME/.test(body(cook, "What's in the box")), 'list stops at the custom heading');
ok(body(cook, 'Safe to use').startsWith('Always follow') && !/\bTO$/.test(body(cook, 'Save time and energy')), '"USE" inside SAFE TO USE is not a Uses heading');
// things that merely look shouty must stay text
const stay = t => splitProductDescription(t).length === 1;
ok(stay('A bright 4K UHD HDR Smart TV for the family room. It has a large screen.'), 'UHD HDR Smart TV is not a heading');
ok(stay('Fits the BM150 BM100 KS Series trimmers. A tidy fit.'), 'model codes are not a heading');
ok(stay('Tihan insecticide. INSECTICIDE FROM STERMONT ARCADE Protects crops all season.'), 'brand tagline stays text');
ok(titles(splitProductDescription('Intro here. EASY CLEAN-UP The pot wipes clean.')).includes('Easy clean-up'), 'two words after a full stop are a heading');
ok(!titles(splitProductDescription('Panel: IPS LCD Display with deep blacks and wide angles.')).includes('Ips lcd'), 'two words inside a sentence are not');
assert.equal(headingCase('TV GUARD AND WALL MOUNT INCLUDED'), 'TV guard and wall mount included'); n++;
// numbered steps written inline
const num = splitNumbered('Rate: 200 ml per hectare. 1. Half-fill the knapsack. 2. Add the product, then top up. 3. Spray both sides of the leaf.');
assert.deepEqual(num, { intro: 'Rate: 200 ml per hectare.', steps: ['Half-fill the knapsack.', 'Add the product, then top up.', 'Spray both sides of the leaf.'] }); n++;
ok(splitNumbered('Spray 1,000 L of water. Mix well.') === null && splitNumbered('1. Only one step.') === null, 'no numbering -> null');
const mix = splitProductDescription('Intro. MIXING AND APPLICATION DOSAGE (per 20 L knapsack) Rate: 4 ml. 1. Fill. 2. Spray.');
ok(body(mix, 'Mixing & application').startsWith('Rate: 4 ml'), 'parenthetical qualifier belongs to the heading');
console.log(`mobile-shell description: ${n} checks passed`);
