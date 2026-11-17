// Run: node product-description-html.test.mjs
import assert from 'node:assert/strict';
import { productDescriptionHtml, splitFaq, extractProductFaq } from './product-description-html.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const heads = h => [...h.matchAll(/<h3>(.*?)<\/h3>/g)].map(m => m[1].replace(/&amp;/g, '&'));

const advion = 'Tatua Advion is a ready-to-use gel bait. KEY FEATURES • Ready-to-use • No mixing needed SPECIFICATIONS • Brand: Tatua • Form: Gel WHERE IT HELPS Cockroaches hide in tight places. HOW TO USE IT Clean the area first. Apply small dots. BEFORE YOU START • Wipe the cupboards • Fix leaks SAFETY Read the label before use. STORAGE Keep in a cool, dry place. FREQUENTLY ASKED QUESTIONS Why a gel? Cockroaches eat it. It is neat. How much? Use small dots. ORDER Order online. PRODUCT BUYING GUIDE: generic filler that must be removed.';
const out = productDescriptionHtml(advion);
assert.deepEqual(heads(out), ['Product overview', 'Key features & benefits', 'Specifications & product details', 'Uses & applications', 'How to use', 'Before you start', 'Safety information', 'Storage & handling', 'Frequently asked questions', 'Ordering & delivery']); n++;
ok(!out.includes('Product information'), 'no generic repeated heading');
ok(!/generic filler/.test(out), 'buying-guide boilerplate removed');
ok(/<h3>Key features &amp; benefits<\/h3><ul><li>Ready-to-use<\/li><li>No mixing needed<\/li><\/ul>/.test(out), 'features are a list under their own heading');
ok(/<h3>Safety information<\/h3><p>Read the label before use\.<\/p>/.test(out), 'safety text sits under Safety');
ok(/<strong>Why a gel\?<\/strong><br>Cockroaches eat it\. It is neat\./.test(out), 'FAQ question and multi-sentence answer');
ok(/<strong>How much\?<\/strong><br>Use small dots\./.test(out), 'second FAQ item');

// New premium-format headings must become distinct semantic sections.
const premium = productDescriptionHtml('PRODUCT OVERVIEW\nA product-specific opening. KEY FEATURES & BENEFITS\n• Confirmed feature: practical benefit. SPECIFICATIONS\n• Pack size: 500 ml. BUYING GUIDE\nChoose by the exact use case. IMPORTANT NOTES\nCheck the current label. ORDERING & DELIVERY\nAsk for current availability.');
assert.deepEqual(heads(premium), ['Product overview', 'Key features & benefits', 'Specifications & product details', 'Buying guide', 'Important notes', 'Ordering & delivery']); n++;

// Car listings historically stored literal \n sequences; they must still create separate headings.
const vehicle = productDescriptionHtml('IMPORTANT NOTES\n• Verify the vehicle.\n\nBUYING NOTES\n• Confirm charges.\n\nVEHICLE-SPECIFIC BUYING GUIDE\n\nInspect the exact model.\n\nVEHICLE ENQUIRY & NEXT STEPS\nRequest VIN and photos.');
assert.deepEqual(heads(vehicle), ['Important notes', 'Buying notes', 'Buying guide', 'Vehicle enquiry & next steps']); n++;
ok(/<h3>Buying guide<\/h3><p>Inspect the exact model\.<\/p>/.test(vehicle), 'vehicle buying guide is its own heading');
ok(/<h3>Vehicle enquiry &amp; next steps<\/h3><p>Request VIN and photos\.<\/p>/.test(vehicle), 'vehicle enquiry is its own heading');

// Car content: escaped line breaks and vehicle headings must render as separate sections.
const car = productDescriptionHtml('PRODUCT SUMMARY\nA buyer-facing introduction.\n\nIMPORTANT BUYING NOTES\nConfirm the current quote.\n\nVEHICLE-SPECIFIC BUYING GUIDE\nInspect the exact vehicle and compare its condition.\n\nVEHICLE ENQUIRY & NEXT STEPS\nRequest current photos and a written quotation.');
assert.deepEqual(heads(car), ['Product overview', 'Buying notes', 'Buying guide', 'Vehicle enquiry & next steps']); n++;
ok(/<h3>Buying guide<\/h3><p>Inspect the exact vehicle and compare its condition\.<\/p>/.test(car), 'car buying guide renders as a separate heading');
ok(/<h3>Vehicle enquiry &amp; next steps<\/h3><p>Request current photos and a written quotation\.<\/p>/.test(car), 'car enquiry renders as a separate heading');

// Unlabelled descriptions now receive useful subtitles, with every original sentence retained.
const plain = productDescriptionHtml('A stainless steel milk can has a 20 litre capacity. Its smooth metal body is designed for dairy collection. Dairy farmers use it to carry milk from the shed to the collection point. It is suitable for smallholder milk collection routines. Before use, wash and sanitise the can. Follow the dairy cleaning procedure before filling it. After each collection, rinse the can thoroughly. Store it in a clean dry place between uses. Confirm the exact model and lid arrangement before ordering. Ask the seller whether the lid is included.');
assert.deepEqual(heads(plain), ['Product overview', 'Uses & applications', 'How to use & application', 'Care, cleaning & storage', 'Buying guide & product checks']); n++;
ok(plain.includes('20 litre capacity') && plain.includes('collection point') && plain.includes('clean dry place') && plain.includes('lid arrangement'), 'all source facts remain in rendered copy');
// Short plain descriptions still get one useful overview heading.
const shortPlain = productDescriptionHtml('Use it safely and order today. Storage is easy.');
assert.deepEqual(heads(shortPlain), ['Product overview']); n++;
// duplicate label merges, empty source falls back
assert.deepEqual(heads(productDescriptionHtml('Intro. SAFETY Wear gloves. STORAGE Keep dry. SAFETY Wash hands.')), ['Product overview', 'Safety information', 'Storage & handling']); n++;
ok(productDescriptionHtml('').includes('will be updated shortly'), 'empty fallback');
// FAQ splitter refuses text that is not a clean Q&A list
ok(splitFaq('Just one sentence.') === null && splitFaq('Only one? Yes.') === null, 'non-FAQ text is left alone');


// Safety headings used by crop-protection listings must remain whole section labels.
const safetyHandling = productDescriptionHtml('PRODUCT OVERVIEW\nA crop-protection product. SAFETY AND RESPONSIBLE HANDLING\nRead the current label and wear the specified PPE. STORAGE AND DISPOSAL\nKeep in original packaging and dispose as directed.');
assert.deepEqual(heads(safetyHandling), ['Product overview', 'Safety information', 'Storage & handling']); n++;
ok(/<h3>Safety information<\/h3><p>Read the current label and wear the specified PPE\.<\/p>/.test(safetyHandling), 'responsible-handling heading does not leak into safety body');
ok(/<h3>Storage &amp; handling<\/h3><p>Keep in original packaging and dispose as directed\.<\/p>/.test(safetyHandling), 'storage-and-disposal heading is preserved');

const safetyUse = productDescriptionHtml('PRODUCT OVERVIEW\nA public-health product. SAFETY AND RESPONSIBLE USE\nRead the label before handling. STORAGE AND DISPOSAL\nStore securely in original packaging.');
assert.deepEqual(heads(safetyUse), ['Product overview', 'Safety information', 'Storage & handling']); n++;

console.log(`product-description-html: ${n} checks passed`);


// Markdown-formatted catalogue drafts are normalised into the seven storefront sections and four Q&As.
const markdownGuide = '# Sample Insecticide — Price in Kenya ## Product overview A concise overview. A second sentence. ## Technical specifications & pack details • Brand: Sample • Pack size: 100 ml ## Where & how to use in Kenya Use only for a verified label-approved purpose. ## Safety, storage & handling guidelines Follow the current label and store securely. ## Buying & pack-size guide Compare the exact pack. Browse [fumigation chemicals](https://stermontarcade.co.ke/c/fumigation-chemicals.html). ## Delivery across Kenya & Nairobi pickup Pay by M-Pesa and confirm delivery. ## Frequently asked questions ### What pack size is listed? This listing is for 100 ml. ### What should I check before use? Read the approved product label. ### Can I pay by M-Pesa? Yes, use the site checkout. ### Where is pickup coordinated? Sarit Centre, Westlands, Nairobi.';
const markdownHtml = productDescriptionHtml(markdownGuide);
assert.deepEqual(heads(markdownHtml), [
  'Product Overview & Key Benefits',
  'Technical Specifications & Pack Details',
  'Where &amp; How to Use in Kenya',
  'Safety, Storage & Handling Guidelines',
  'Buying & Pack-Size Guide',
  'Delivery across Kenya &amp; Nairobi Pickup',
  'Frequently Asked Questions'
]); n++;
const productFaq = extractProductFaq(markdownGuide);
assert.equal(productFaq.length, 4); n++;
ok(productFaq[0].q === 'What pack size is listed?' && productFaq[0].a === 'This listing is for 100 ml.', 'four authored FAQ pairs are extracted for JSON-LD');
ok(/<a href="\/c\/fumigation-chemicals\.html">fumigation chemicals<\/a>/.test(markdownHtml), 'internal Markdown links render as safe links');
const longParagraph = productDescriptionHtml('PRODUCT OVERVIEW\nOne sentence. Two sentences. Three sentences. Four sentences. Five sentences. Six sentences. Seven sentences.');
ok((longParagraph.match(/<p>/g) || []).length >= 3, 'long text is split into paragraphs of at most three sentences');
