// Run: node product-description-html.test.mjs
import assert from 'node:assert/strict';
import { productDescriptionHtml, splitFaq, extractProductFaq } from './product-description-html.mjs';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const heads = h => [...h.matchAll(/<h3>(.*?)<\/h3>/g)].map(m => m[1].replace(/&amp;/g, '&'));

const advion = 'Tatua Advion is a ready-to-use gel bait. KEY FEATURES • Ready-to-use • No mixing needed SPECIFICATIONS • Brand: Tatua • Form: Gel WHERE IT HELPS Cockroaches hide in tight places. HOW TO USE IT Clean the area first. Apply small dots. BEFORE YOU START • Wipe the cupboards • Fix leaks SAFETY Read the label before use. STORAGE Keep in a cool, dry place. FREQUENTLY ASKED QUESTIONS Why a gel? Cockroaches eat it. It is neat. How much? Use small dots. ORDER Order online. PRODUCT BUYING GUIDE: generic filler that must be removed.';
const out = productDescriptionHtml(advion);
// Legacy uppercase labels render under the canonical storefront headings; unlabelled opening text and non-canonical sections follow them.
assert.deepEqual(heads(out), ['Product Overview & Key Benefits', 'Technical Specifications & Pack Details', 'Where & How to Use in Kenya', 'Safety, Storage & Handling Guidelines', 'Delivery across Kenya & Nairobi Pickup', 'Frequently Asked Questions', 'Product overview', 'How to use', 'Before you start']); n++;
ok(!out.includes('Product information'), 'no generic repeated heading');
ok(!/generic filler/.test(out), 'buying-guide boilerplate removed');
ok(/<h3>Product Overview &amp; Key Benefits<\/h3><ul><li>Ready-to-use<\/li><li>No mixing needed<\/li><\/ul>/.test(out), 'features are a list under the canonical overview heading');
ok(/<h3>Safety, Storage &amp; Handling Guidelines<\/h3><p>Read the label before use\.\s+Keep in a cool, dry place\.<\/p>/.test(out), 'safety and storage text sit under the canonical safety heading');
ok(/<strong>Why a gel\?<\/strong><br>Cockroaches eat it\. It is neat\./.test(out), 'FAQ question and multi-sentence answer');
ok(/<strong>How much\?<\/strong><br>Use small dots\./.test(out), 'second FAQ item');

// Compound legacy labels must not leak their suffixes into visible paragraph text.
const compoundLabels = productDescriptionHtml('PRODUCT SUMMARY\nA sourcing introduction. SPECIFICATIONS & DETAILS\n• Model: Example. ORDERING, PAYMENT & DELIVERY\nConfirm availability and the final quote. IMAGE CREDIT\nPhoto source: manufacturer reference image.');
assert.deepEqual(heads(compoundLabels), ['Product Overview & Key Benefits', 'Technical Specifications & Pack Details', 'Delivery across Kenya & Nairobi Pickup', 'Image credits']); n++;
ok(!/&amp; DETAILS|PAYMENT &amp; DELIVERY|IMAGE CREDIT/.test(compoundLabels), 'compound labels are consumed as headings, not displayed in body text');
ok(/<h3>Image credits<\/h3><p>Photo source: manufacturer reference image\.<\/p>/.test(compoundLabels), 'image credit attribution is retained under its own heading');

// New premium-format headings must become distinct semantic sections.
const premium = productDescriptionHtml('PRODUCT OVERVIEW\nA product-specific opening. KEY FEATURES & BENEFITS\n• Confirmed feature: practical benefit. SPECIFICATIONS\n• Pack size: 500 ml. BUYING GUIDE\nChoose by the exact use case. IMPORTANT NOTES\nCheck the current label. ORDERING & DELIVERY\nAsk for current availability.');
assert.deepEqual(heads(premium), ['Product Overview & Key Benefits', 'Technical Specifications & Pack Details', 'Buying & Pack-Size Guide', 'Delivery across Kenya & Nairobi Pickup', 'Important notes']); n++;

// Car listings historically stored literal \n sequences; they must still create separate headings.
const vehicle = productDescriptionHtml('IMPORTANT NOTES\n• Verify the vehicle.\n\nBUYING NOTES\n• Confirm charges.\n\nVEHICLE-SPECIFIC BUYING GUIDE\n\nInspect the exact model.\n\nVEHICLE ENQUIRY & NEXT STEPS\nRequest VIN and photos.');
assert.deepEqual(heads(vehicle), ['Buying & Pack-Size Guide', 'Important notes', 'Vehicle enquiry & next steps']); n++;
ok(/<h3>Buying &amp; Pack-Size Guide<\/h3><ul><li>Confirm charges\. Inspect the exact model\.<\/li><\/ul>/.test(vehicle), 'vehicle buying notes and guide keep their text under the canonical buying heading');
ok(/<h3>Vehicle enquiry &amp; next steps<\/h3><p>Request VIN and photos\.<\/p>/.test(vehicle), 'vehicle enquiry is its own heading');

// Car content: escaped line breaks and vehicle headings must render as separate sections.
const car = productDescriptionHtml('PRODUCT SUMMARY\nA buyer-facing introduction.\n\nIMPORTANT BUYING NOTES\nConfirm the current quote.\n\nVEHICLE-SPECIFIC BUYING GUIDE\nInspect the exact vehicle and compare its condition.\n\nVEHICLE ENQUIRY & NEXT STEPS\nRequest current photos and a written quotation.');
assert.deepEqual(heads(car), ['Product Overview & Key Benefits', 'Buying & Pack-Size Guide', 'Vehicle enquiry & next steps']); n++;
ok(/<h3>Buying &amp; Pack-Size Guide<\/h3><p>Confirm the current quote\.\s+Inspect the exact vehicle and compare its condition\.<\/p>/.test(car), 'car buying notes and guide keep their text under the canonical buying heading');
ok(/<h3>Vehicle enquiry &amp; next steps<\/h3><p>Request current photos and a written quotation\.<\/p>/.test(car), 'car enquiry renders as a separate heading');

// Unlabelled descriptions now receive useful subtitles, with every original sentence retained.
const plain = productDescriptionHtml('A stainless steel milk can has a 20 litre capacity. Its smooth metal body is designed for dairy collection. Dairy farmers use it to carry milk from the shed to the collection point. It is suitable for smallholder milk collection routines. Before use, wash and sanitise the can. Follow the dairy cleaning procedure before filling it. After each collection, rinse the can thoroughly. Store it in a clean dry place between uses. Confirm the exact model and lid arrangement before ordering. Ask the seller whether the lid is included.');
assert.deepEqual(heads(plain), ['Product overview', 'Uses & applications', 'How to use & application', 'Care, cleaning & storage', 'Buying guide & product checks']); n++;
ok(plain.includes('20 litre capacity') && plain.includes('collection point') && plain.includes('clean dry place') && plain.includes('lid arrangement'), 'all source facts remain in rendered copy');
// Short plain descriptions still get one useful overview heading.
const shortPlain = productDescriptionHtml('Use it safely and order today. Storage is easy.');
assert.deepEqual(heads(shortPlain), ['Product overview']); n++;
// duplicate label merges, empty source falls back
assert.deepEqual(heads(productDescriptionHtml('Intro. SAFETY Wear gloves. STORAGE Keep dry. SAFETY Wash hands.')), ['Safety, Storage & Handling Guidelines', 'Product overview']); n++;
ok(productDescriptionHtml('').includes('will be updated shortly'), 'empty fallback');
// FAQ splitter refuses text that is not a clean Q&A list
ok(splitFaq('Just one sentence.') === null && splitFaq('Only one? Yes.') === null, 'non-FAQ text is left alone');


// Safety headings used by crop-protection listings must remain whole section labels.
const safetyHandling = productDescriptionHtml('PRODUCT OVERVIEW\nA crop-protection product. SAFETY AND RESPONSIBLE HANDLING\nRead the current label and wear the specified PPE. STORAGE AND DISPOSAL\nKeep in original packaging and dispose as directed.');
assert.deepEqual(heads(safetyHandling), ['Product Overview & Key Benefits', 'Safety, Storage & Handling Guidelines']); n++;
ok(/<h3>Safety, Storage &amp; Handling Guidelines<\/h3><p>Read the current label and wear the specified PPE\./.test(safetyHandling) && !/RESPONSIBLE HANDLING/i.test(safetyHandling), 'responsible-handling heading does not leak into safety body');
ok(/Keep in original packaging and dispose as directed\.<\/p>/.test(safetyHandling) && !/STORAGE AND DISPOSAL/i.test(safetyHandling), 'storage-and-disposal text is kept under the canonical safety heading');

const safetyUse = productDescriptionHtml('PRODUCT OVERVIEW\nA public-health product. SAFETY AND RESPONSIBLE USE\nRead the label before handling. STORAGE AND DISPOSAL\nStore securely in original packaging.');
assert.deepEqual(heads(safetyUse), ['Product Overview & Key Benefits', 'Safety, Storage & Handling Guidelines']); n++;

console.log(`product-description-html: ${n} checks passed`);


// Markdown-formatted catalogue drafts are normalised into the seven storefront sections and four Q&As.
const markdownGuide = '# Sample Insecticide — Price in Kenya ## Product overview A concise overview. A second sentence. ## Technical specifications & pack details • Brand: Sample • Pack size: 100 ml ## Where & how to use in Kenya Use only for a verified label-approved purpose. ## Safety, storage & handling guidelines Follow the current label and store securely. ## Buying & pack-size guide Compare the exact pack. Browse [fumigation chemicals](https://stermontarcade.co.ke/c/fumigation-chemicals.html). ## Delivery across Kenya & Nairobi pickup Pay by M-Pesa and confirm delivery. ## Frequently asked questions ### What pack size is listed? This listing is for 100 ml. ### What should I check before use? Read the approved product label. ### Can I pay by M-Pesa? Yes, use the site checkout. ### Where is pickup coordinated? Sarit Centre, Westlands, Nairobi.';
const markdownHtml = productDescriptionHtml(markdownGuide);
// heads() decodes &amp; to &, so every expectation uses a plain ampersand.
assert.deepEqual(heads(markdownHtml), [
  'Product Overview & Key Benefits',
  'Technical Specifications & Pack Details',
  'Where & How to Use in Kenya',
  'Safety, Storage & Handling Guidelines',
  'Buying & Pack-Size Guide',
  'Delivery across Kenya & Nairobi Pickup',
  'Frequently Asked Questions'
]); n++;
const productFaq = extractProductFaq(markdownGuide);
assert.equal(productFaq.length, 4); n++;
ok(productFaq[0].q === 'What pack size is listed?' && productFaq[0].a === 'This listing is for 100 ml.', 'four authored FAQ pairs are extracted for JSON-LD');
ok(/<a href="\/c\/fumigation-chemicals\.html">fumigation chemicals<\/a>/.test(markdownHtml), 'internal Markdown links render as safe links');
const longParagraph = productDescriptionHtml('PRODUCT OVERVIEW\nOne sentence. Two sentences. Three sentences. Four sentences. Five sentences. Six sentences. Seven sentences.');
ok((longParagraph.match(/<p>/g) || []).length >= 3, 'long text is split into paragraphs of at most three sentences');


// Inline legacy Markdown headings are split into canonical storefront sections.
const inlineGuide = '## Product overview Navigator 100SC 20ml is a public-health product. ## Product identity and technical details The supplier identifies the 20ml pack. ## Registered target pests and use context PCPB register details must be checked. ## Safety and label compliance Follow the exact label and PPE requirements. ## Pack-size comparison and buying decisions Compare exact packs and browse [pest control services](/services/). ## Ordering, pickup and delivery M-Pesa checkout and pickup coordination are available. ## Frequently asked questions\nQ: What pack is this? This is the 20ml pack.\nQ: What should I verify? Confirm the label.\nQ: How can I pay? Use M-Pesa checkout.\nQ: Where is pickup? Sarit Centre Westlands, Nairobi.';
const inlineRendered = productDescriptionHtml(inlineGuide);
assert.deepEqual(heads(inlineRendered), [
  'Product Overview & Key Benefits',
  'Technical Specifications & Pack Details',
  'Where & How to Use in Kenya',
  'Safety, Storage & Handling Guidelines',
  'Buying & Pack-Size Guide',
  'Delivery across Kenya & Nairobi Pickup',
  'Frequently Asked Questions'
]); n++;
assert.equal(extractProductFaq(inlineGuide).length, 4); n++;
ok(/<a href="\/services\/">pest control services<\/a>/.test(inlineRendered), 'service links survive the formatted buying section');


// Product guide titles followed by prose on the same line become canonical H3s; internal supplier-price arithmetic is hidden.
const inlinePriceGuide = '## Product overview Navigator 100SC 20ml is a registered product. ## Product identity and pack size The pack is 20ml. ## Registered public-health use PCPB lists the registered domestic public-health uses. ## Exact source price and baseline calculation Imagine Care lists the supplier price and store markup calculation. ## Safety and regulatory checks Follow the exact Kenyan label. ## Buying Navigator 100SC 20ml in Kenya Shoppers should confirm the exact pack and invoice. ## Ordering, pickup and delivery M-Pesa checkout and delivery details are available. ## Frequently asked questions\nQ: What pack is this? It is 20ml.\nQ: What should I check? Confirm the original label.\nQ: How can I pay? Use M-Pesa checkout.\nQ: Where is pickup? Sarit Centre Westlands, Nairobi. ## Listing status This is an internal draft note.';
const inlinePriceHtml = productDescriptionHtml(inlinePriceGuide);
assert.deepEqual(heads(inlinePriceHtml), [
  'Product Overview & Key Benefits',
  'Technical Specifications & Pack Details',
  'Where & How to Use in Kenya',
  'Safety, Storage & Handling Guidelines',
  'Buying & Pack-Size Guide',
  'Delivery across Kenya & Nairobi Pickup',
  'Frequently Asked Questions'
]); n++;
ok(!/supplier price|markup calculation|internal draft note/i.test(inlinePriceHtml), 'supplier pricing arithmetic and listing status never render to buyers');
assert.equal(extractProductFaq(inlinePriceGuide).length, 4); n++;


// Brand-led pack-comparison copy is separated from its inline heading; overview prefix is not duplicated as body text.
const comparingGuide = '## Product overview Air Chopper 7.5% SC 30ml is the exact pack. ## Comparing 15ml, 30ml and 100ml options Air Chopper is sold in several sizes. The 15ml, 30ml and 100ml bottles are separate listings. ## Safety and label checks Follow the exact label.';
const comparingHtml = productDescriptionHtml(comparingGuide);
assert.ok(heads(comparingHtml).includes('Product Overview & Key Benefits'));
assert.ok(heads(comparingHtml).includes('Buying & Pack-Size Guide'));
ok(!/&amp; Key Benefits<\/p>/.test(comparingHtml), 'canonical overview title is not repeated in its paragraph');


// Legacy uppercase labels also render with the canonical storefront section names.
const legacyLabels = productDescriptionHtml('PRODUCT OVERVIEW\nA product summary. SPECIFICATIONS\nBrand: Example. APPLICATION & USE\nCheck the approved label. SAFETY INFORMATION\nFollow label precautions. BUYING GUIDE\nCompare the exact pack. ORDERING & DELIVERY\nUse M-Pesa checkout. FAQS\nQ: What is this? An example. Q: What size? A pack. Q: How to pay? M-Pesa. Q: Where pickup? Sarit Centre.');
assert.deepEqual(heads(legacyLabels), [
  'Product Overview & Key Benefits',
  'Technical Specifications & Pack Details',
  'Where & How to Use in Kenya',
  'Safety, Storage & Handling Guidelines',
  'Buying & Pack-Size Guide',
  'Delivery across Kenya & Nairobi Pickup',
  'Frequently Asked Questions'
]); n++;

// Decimal concentrations and percentages must not be split into separate sentences/paragraphs.
const decimalGuide = productDescriptionHtml('PRODUCT OVERVIEW\nAir Chopper 7.5% SC contains 0.5 g/L of an ingredient. The pack is 15ml. Follow the approved label.');
ok(/Air Chopper 7\.5% SC contains 0\.5 g\/L/.test(decimalGuide), 'decimal concentrations remain intact in rendered paragraphs');
ok(!/<p>&amp; Key Benefits<\/p>/.test(comparingHtml), 'overview suffix is not repeated as body text');


// Legacy category links embedded in product descriptions are rewritten to current, generated /c/ routes.
const legacyCategoryLinks = productDescriptionHtml('BUYING GUIDE\\nCompare related listings: [Agrovet category](https://stermontarcade.co.ke/category/agrovet), [Seeds & Seedlings](/category/seeds-seedlings), [Fertilizers](https://stermontarcade.co.ke/category/fertilizers), [Farm & Garden Tools](/category/farm-garden-tools) and [Sprayers & Equipment](/category/sprayers-equipment).');
ok(/href="\/c\/agrovet\.html"/.test(legacyCategoryLinks), 'absolute legacy category URLs use the generated /c/ route');
ok(/href="\/c\/seeds-seedlings\.html"/.test(legacyCategoryLinks), 'relative legacy category URLs use the generated /c/ route');
ok(/href="\/c\/fertilizers\.html"/.test(legacyCategoryLinks), 'absolute legacy fertilizer URLs use the generated /c/ route');
ok(/href="\/c\/farm-garden-tools\.html"/.test(legacyCategoryLinks), 'farm and garden tool links use the generated /c/ route');
ok(/href="\/c\/sprayers-equipment\.html"/.test(legacyCategoryLinks), 'sprayer category links use the generated /c/ route');
ok(!legacyCategoryLinks.includes('/category/'), 'rendered product copy contains no obsolete category routes');

// Authored heading lines (owner request 2026-11-26): every sub-topic written as its own short line is a real heading, rendered like "Product overview".
const trevinRaw = '\nTrevin Dudu Dust Insecticide 200g in Kenya\nProduct purpose and formulation\nWhere it may be useful\nThis product is relevant to buyers managing safari ants, fleas, bedbugs, lice, mites, ticks and keds. Start by identifying the pest and locating evidence of activity.\nChoosing the correct pack size\nThis page is specifically for the 200g pack. Pack size affects the quantity available for a treatment plan, but it does not by itself indicate a different concentration.\nSafety and responsible handling\nKeep pest-control products in their original labelled packaging and away from food, drinking water, children and pets.\nBuying pest-control products in Kenya\nOrdering from Stermont Arcade\nStermont Arcade serves customers in Nairobi and across Kenya. Pickup is available at Sarit Centre, Westlands.\nCHOOSING THE 200G PACK\nThe 200g listing gives buyers a larger net quantity than the 100g pack while retaining the same named product.\n\nFrequently asked questions\nWhat is this product for?\n It is listed for safari ants, fleas and bedbugs. Use it only for approved purposes.\nHow should I use it?\n Follow the full label directions.\nIs this the correct pack size?\n This listing is for 200g; check the title and packaging before opening.\n';
const trevin = productDescriptionHtml(trevinRaw);
assert.deepEqual(heads(trevin), ['Product overview', 'Product purpose and formulation', 'Choosing the correct pack size', 'Safety and responsible handling', 'Buying pest-control products in Kenya', 'Choosing the 200g pack', 'Frequently asked questions']); n++;
ok(/<h3>Product purpose and formulation<\/h3><h4>Where it may be useful<\/h4><p>This product is relevant/.test(trevin), 'two heading lines in a row keep both: title plus purple subtitle (h4)');
ok(/<h3>Buying pest-control products in Kenya<\/h3><h4>Ordering from Stermont Arcade<\/h4>/.test(trevin), 'second heading pair keeps its subtitle');
ok(/<h3>Product overview<\/h3><p>Trevin Dudu Dust Insecticide 200g in Kenya<\/p>/.test(trevin), 'the first line stays the overview text, it is never promoted to a heading');
ok(!/<p>(?:Where it may be useful|Choosing the correct pack size|Safety and responsible handling|Frequently asked questions)<\/p>/.test(trevin) && !/Start by identifying the pest and locating evidence of activity\.\s*Choosing/.test(trevin), 'heading lines never leak into paragraphs');
ok(/<h3>Frequently asked questions<\/h3><p><strong>What is this product for\?<\/strong><br>It is listed for safari ants/.test(trevin) && /<strong>Is this the correct pack size\?<\/strong><br>This listing is for 200g/.test(trevin), 'FAQ under an authored heading renders question and answer');
ok(trevin.indexOf('Frequently asked questions') > trevin.indexOf('Choosing the 200g pack') && trevin.indexOf('Choosing the correct pack size') < trevin.indexOf('Safety and responsible handling'), 'authored headings keep the written order');
ok(/<h3>Choosing the 200g pack<\/h3>/.test(trevin) && !/200G PACK/.test(trevin), 'ALL CAPS heading lines are shown in sentence case');
ok(/<h3>PCPB registration details<\/h3>/.test(productDescriptionHtml('Opening line of the product.\nPCPB REGISTRATION DETAILS\nThe product is registered with the board and the label carries its number.\nBefore you order\nCheck the exact pack size on the title and compare it with the label.')), 'acronyms stay in capitals inside a sentence-cased heading');
// Conservative: no authored heading is guessed from ordinary lines.
const specLines = productDescriptionHtml('Stainless steel milk can for dairy farmers.\nCapacity 20 litres\nMaterial stainless steel\nColour silver\nWeight 2 kg\nThe can has a smooth body designed for dairy collection and easy cleaning after each use.');
ok(!/<h3>Capacity 20 litres<\/h3>/.test(specLines) && !/<h4>/.test(specLines), 'a block of short spec lines is not turned into headings');
const oneHeading = productDescriptionHtml('Opening line of the product.\nOnly one heading here\nThe body paragraph under it is long enough to count as real text for the product.');
ok(!/<h3>Only one heading here<\/h3>/.test(oneHeading), 'a single candidate heading is not enough evidence, so nothing is promoted');
ok(!/<h3>Label<\/h3>/.test(productDescriptionHtml('Intro line.\nLabel: a value that is long enough to look like a normal paragraph of text.\nBrand: Tatua, a value that is also long enough to be a paragraph.')), '"Label: value" lines are data, not headings');
ok(/<h3>Where it may be useful<\/h3>/.test(productDescriptionHtml('Opening line.\n**Where it may be useful**\nThis product suits homes, shops and offices where the target pest is present.\n**How to choose a pack**\nCompare the exact pack size shown in the title with the label before ordering.')), 'full-line **bold** headings are recognised too');
console.log(`product-description-html authored headings: ${n} checks passed in total`);
