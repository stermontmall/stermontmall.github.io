// Run: node mobile-shell/description-headings.test.mjs
// Authored heading lines (owner request 2026-11-26): every sub-topic written as its own short line is a real heading and renders like "Product overview".
// Tests the pure helpers inside mobile-shell/app.js (same block as description.test.mjs). The same rules are tested for the static pages in product-description-html.test.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('/* @desc-start'), src.indexOf('/* @desc-end */'));
assert.ok(block.includes('function findHeadingLines'), 'heading-line helper found');
const { splitProductDescription, findHeadingLines } = new Function(block + '\nreturn { splitProductDescription, findHeadingLines };')();
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const titles = s => s.map(x => x.title);

const trevin = '\nTrevin Dudu Dust Insecticide 200g in Kenya\nProduct purpose and formulation\nWhere it may be useful\nThis product is relevant to buyers managing safari ants, fleas, bedbugs, lice, mites, ticks and keds. Start by identifying the pest and locating evidence of activity.\nChoosing the correct pack size\nThis page is specifically for the 200g pack. Pack size affects the quantity available for a treatment plan, but it does not by itself indicate a different concentration.\nUse and application guidance\nApply only to label-approved surfaces, avoiding food and areas accessible to children or pets. Follow the full label directions.\nSafety and responsible handling\nKeep pest-control products in their original labelled packaging and away from food, drinking water, children and pets.\nBuying pest-control products in Kenya\nOrdering from Stermont Arcade\nStermont Arcade serves customers in Nairobi and across Kenya. Pickup is available at Sarit Centre, Westlands.\nCHOOSING THE 200G PACK\nThe 200g listing gives buyers a larger net quantity than the 100g pack while retaining the same named product.\n\nFrequently asked questions\nWhat is this product for?\n It is listed for safari ants, fleas and bedbugs. Use it only for approved purposes.\nHow should I use it?\n Follow the full label directions.\nIs this the correct pack size?\n This listing is for 200g; check the title and packaging before opening.\n';
const s = splitProductDescription(trevin);
assert.deepEqual(titles(s), ['Product overview', 'Product purpose and formulation', 'Choosing the correct pack size', 'Use and application guidance', 'Safety and responsible handling', 'Buying pest-control products in Kenya', 'Choosing the 200g pack', 'Frequently asked questions']); n++;
ok(s[0].body === 'Trevin Dudu Dust Insecticide 200g in Kenya', 'the first line stays the overview text');
assert.deepEqual(s[1].subs, ['Where it may be useful']); n++;
assert.deepEqual(s[5].subs, ['Ordering from Stermont Arcade']); n++;
ok(s[1].body.startsWith('This product is relevant'), 'body follows the grouped headings');
ok(s[7].kind === 'Frequently asked questions' && s[5].kind === 'Ordering, payment & delivery', 'FAQ and ordering sections keep their special layout');
ok(s[2].kind === 'Choosing the correct pack size', 'other authored headings keep their own wording');
ok(!s.some(x => /Where it may be useful|Choosing the correct pack size|Frequently asked questions/.test(x.body)), 'heading lines never leak into body text');
ok(s[7].body.startsWith('What is this product for?'), 'FAQ questions stay in the FAQ body');
ok(!s.some(x => /200G PACK/.test(x.title)), 'ALL CAPS heading lines are shown in sentence case');

// Literal "\n" sequences (older car listings) become real line breaks before headings are looked for.
ok(titles(splitProductDescription('Opening line.\\nFirst topic here\\nThe first topic has a paragraph that is long enough to count as text.\\nSecond topic here\\nThe second topic has a paragraph that is long enough to count too.')).join('|') === 'Product overview|First topic here|Second topic here', 'escaped line breaks');

// Conservative rules: nothing is guessed from ordinary lines.
ok(findHeadingLines('Stainless steel milk can.\nCapacity 20 litres\nMaterial stainless steel\nColour silver\nWeight 2 kg\nThe can has a smooth body designed for dairy collection and easy cleaning.').length === 0, 'a block of short spec lines is not headings');
ok(findHeadingLines('Opening.\nOnly one heading here\nThe body paragraph under it is long enough to count as real text for the product.').length === 0, 'one candidate heading is not enough evidence');
ok(findHeadingLines('Intro.\nBrand: Tatua, a value that is long enough to be a paragraph of text here.\nForm: gel, another value that is long enough to be a paragraph of text.').length === 0, '"Label: value" lines are data');
ok(findHeadingLines('Single line description without any line breaks at all but with plenty of words.').length === 0, 'one-line text has no heading lines');

// Known uppercase labels and the old single-line format are untouched.
assert.deepEqual(titles(splitProductDescription('Intro text. SAFETY Wear gloves. STORAGE Keep dry.')), ['Product overview', 'Safety information', 'Storage & handling']); n++;
assert.deepEqual(titles(splitProductDescription('Opening line.\nSAFETY\nRead the label before use and wear the protective equipment it asks for.\nSTORAGE\nKeep in the original closed packaging in a dry and secure place away from food.')), ['Product overview', 'Safety information', 'Storage & handling']); n++;
// An authored line that only starts with a known label word keeps its whole line as the heading.
ok(titles(splitProductDescription('Opening line.\nSTORAGE OF THE POWDER\nKeep the powder in its original closed packaging in a dry and secure place.\nHOW TO CHOOSE A PACK\nCompare the exact pack size shown in the title with the label before ordering.')).join('|') === 'Product overview|Storage of the powder|How to choose a pack', 'a label word at the start of an authored line does not cut the heading');
// Markdown headings (2026-11-26): "##" lines become purple cards and no markdown marks reach the shopper.
const md = splitProductDescription('# Pond Net\n## Product overview\nA net for ponds.\n## Empty heading\n## Where to use it\nUse over [fish ponds](https://stermontarcade.co.ke/c/fish-farming.html).\n### Care\nStore it **dry**.\n## Frequently asked questions\n**1. Does it fit?** Measure your pond first.\n**2. Do you deliver?** Yes, across Kenya.');
assert.deepEqual(titles(md), ['Product overview', 'Where to use it', 'Care', 'Frequently asked questions']); n++;
ok(!md.some(x => /##|\*\*|\]\(/.test(x.title + x.body + x.subs.join(''))), 'no markdown marks remain');
ok(md[1].body.includes('fish ponds') && md[2].body.includes('Store it dry.'), 'link words and subsection text are kept');
ok(md[3].kind === 'Frequently asked questions' && md[3].body.startsWith('Does it fit?'), 'numbered FAQ questions are cleaned');
console.log(`mobile-shell description headings: ${n} checks passed`);
