// Run: node seo-safe-consumer-copy.test.mjs (no dependencies).
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAFE_CONSUMER_COPY, applySafeConsumerCopy, runSafeConsumerCopy } from './seo-safe-consumer-copy.mjs';

const blazer = SAFE_CONSUMER_COPY['classic-mens-black-formal-blazer.html'];
const green = SAFE_CONSUMER_COPY['apple-iphone-16-128gb-green.html'];
const white = SAFE_CONSUMER_COPY['apple-iphone-16-128gb-white.html'];
const schema = description => '<script type="application/ld+json">' + JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Fixture product',
  sku: 'FIXTURE-1',
  description,
  offers: { '@type': 'Offer', priceCurrency: 'KES', price: 1234 }
}) + '</script>';
const head = (item) => '<meta name="stm-id" content="' + item.id + '">' +
  '<link rel="canonical" href="' + item.canonical + '">';

const genericBlazer = [
  '<li>How to Use and What to Check Before using Classic Men&#39;s Black Formal Blazer, read the manufacturer directions and make sure the product is appropriate for the intended task. Follow the instructions supplied with the exact product and do not substitute advice for a different model or formulation. If the listing does not provide a required technical detail, request it from the seller or manufacturer. For equipment, check the operating environment and any compatibility requirements. For consumables, check the stated pack size and storage requirements. For products used by a team, explain the instructions to everyone who will handle the item and keep the packaging available for reference.</li>',
  '<li>Before You Order Before completing an order for Classic Men&#39;s Black Formal Blazer, verify the product name, selected quantity, pack or unit (the listed pack or unit), displayed price and delivery destination. Ask about any important detail that is missing from the listing, such as dimensions, compatibility, included accessories, warranty, formulation or replacement parts. If you need multiple units, confirm availability and the total order quantity first. Keep your order confirmation and payment reference until the goods have been received and checked. If the item is not the version you intended to buy, contact the seller before opening or using it so that the issue can be assessed promptly.</li>',
  '<li>Frequently Asked Questions\n\nWhat should I check before buying Classic Men&#39;s Black Formal Blazer? Check the exact product identity, stated specifications, pack size, quantity and intended application. Ask the seller to confirm any important detail that is not shown on the listing.</li>'
].join('');
const blazerFixture = head(blazer) + genericBlazer + schema('Blazer fixture summary');

const greenOld = 'The Apple iPhone 16 in green has a 6.1-inch display. FREQUENTLY ASKED QUESTIONS What should I check before buying Apple iPhone 16 128GB, Green? Check the exact product identity, stated specifications, pack size, quantity and intended application. Ask the seller to confirm any…';
const whiteOld = 'The Apple iPhone 16 in white has a 6.1-inch display. FREQUENTLY ASKED QUESTIONS What should I check before buying Apple iPhone 16 128GB, White? Check the exact product identity, stated specifications, pack size, quantity and intended application. Ask the seller to confirm any…';
const greenFixture = head(green) +
  '<p>What should I check before buying Apple iPhone 16 128GB, Green?  Check the exact product identity, stated specifications, pack size, quantity and intended application.  Ask the seller to confirm any important detail that is not shown on the listing.</p>' +
  schema(greenOld);
const whiteFixture = head(white) +
  '<p>What should I check before buying Apple iPhone 16 128GB, White?  Check the exact product identity, stated specifications, pack size, quantity and intended application.  Ask the seller to confirm any important detail that is not shown on the listing.</p>' +
  schema(whiteOld);

let checks = 0;
assert.equal(Object.keys(SAFE_CONSUMER_COPY).length, 3); checks++;
for (const item of [blazer, green, white]) {
  assert.ok(item.canonical.startsWith('https://stermontarcade.co.ke/p/')); checks++;
  assert.ok(item.id.length > 5); checks++;
  assert.ok(item.replacements.length > 0); checks++;
}

const blazerOut = applySafeConsumerCopy(blazerFixture, blazer);
assert.match(blazerOut, /How to Check Fit and Style/); checks++;
assert.match(blazerOut, /Review the selected item, size details and displayed price/); checks++;
assert.match(blazerOut, /Compare the available size and fit information with a blazer you own/); checks++;
assert.doesNotMatch(blazerOut, /intended application|formulation|operating environment|pack size, quantity/i); checks++;
assert.ok(blazerOut.includes(head(blazer))); checks++;
assert.match(blazerOut, /Blazer fixture summary/); checks++;

const greenOut = applySafeConsumerCopy(greenFixture, green);
assert.match(greenOut, /Confirm that Green and 128GB are the variant you want/); checks++;
assert.doesNotMatch(greenOut, /pack size, quantity and intended application|Ask the seller to confirm/); checks++;
const greenJson = JSON.parse(greenOut.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)[1]);
assert.equal(greenJson.description, 'The Apple iPhone 16 in green has a 6.1-inch display.'); checks++;
assert.equal(greenJson.offers.price, 1234); checks++;
assert.equal(greenJson.sku, 'FIXTURE-1'); checks++;

const whiteOut = applySafeConsumerCopy(whiteFixture, white);
assert.match(whiteOut, /Confirm that White and 128GB are the variant you want/); checks++;
const whiteJson = JSON.parse(whiteOut.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)[1]);
assert.equal(whiteJson.description, 'The Apple iPhone 16 in white has a 6.1-inch display.'); checks++;

assert.equal(applySafeConsumerCopy(blazerFixture, { ...blazer, id: 'wrong-id' }), blazerFixture); checks++;
assert.equal(applySafeConsumerCopy(blazerFixture, { ...blazer, canonical: 'https://stermontarcade.co.ke/p/wrong.html' }), blazerFixture); checks++;
assert.equal(applySafeConsumerCopy(blazerFixture.replace('Before You Order Before completing', 'Before You Order missing'), blazer), blazerFixture.replace('Before You Order Before completing', 'Before You Order missing')); checks++;

const unlisted = head(blazer).replace(blazer.id, 'unlisted-id') + genericBlazer + schema('Unlisted');
assert.equal(applySafeConsumerCopy(unlisted, blazer), unlisted); checks++;

const dir = mkdtempSync(join(tmpdir(), 'stm-safe-consumer-copy-'));
const pdir = join(dir, 'p');
mkdirSync(pdir);
writeFileSync(join(pdir, 'classic-mens-black-formal-blazer.html'), blazerFixture);
writeFileSync(join(pdir, 'apple-iphone-16-128gb-green.html'), greenFixture);
writeFileSync(join(pdir, 'apple-iphone-16-128gb-white.html'), whiteFixture);
writeFileSync(join(pdir, 'unlisted-product.html'), unlisted);
runSafeConsumerCopy({ dir: pdir });
assert.match(readFileSync(join(pdir, 'classic-mens-black-formal-blazer.html'), 'utf8'), /How to Check Fit and Style/); checks++;
assert.match(readFileSync(join(pdir, 'apple-iphone-16-128gb-green.html'), 'utf8'), /Confirm that Green and 128GB/); checks++;
assert.match(readFileSync(join(pdir, 'apple-iphone-16-128gb-white.html'), 'utf8'), /Confirm that White and 128GB/); checks++;
assert.equal(readFileSync(join(pdir, 'unlisted-product.html'), 'utf8'), unlisted); checks++;

console.log('OK: ' + checks + ' safe consumer copy checks, 0 violations');
