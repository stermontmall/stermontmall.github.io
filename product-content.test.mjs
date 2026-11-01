// Validates model-specific long-form product content without depending on the live catalogue.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const content = JSON.parse(readFileSync('product-content.json', 'utf8'));
const expected = [
  "hisense-55a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-55-inch",
  "hisense-ref205dr-double-door-fridge-with-water-dispenser-205-litres",
  "hisense-hmc6mbk-7-in-1-pressure-cooker",
  "samsung-43u8000f-crystal-uhd-4k-smart-tv-43-inch",
  "samsung-galaxy-a55-5g-1-piece",
  "tcl-75c6k-qd-mini-led-4k-smart-tv-75-inch",
  "vitron-htc4300qfs-qled-android-smart-tv-with-wall-mount-43-inch",
  "32-inch-frameless-qled-smart-android-tv-free-accessories",
  "classic-mens-black-formal-blazer",
  "dahua-full-hd-gaming-monitor",
  "glamstar-double-door-refrigerator",
  "elite-tailoring-mustard-yellow-blazer-piece",
  "elite-tailoring-royal-blue-textured-blazer-piece",
  "itel-smartphone",
  "nunix-gas-and-electric-cooker",
  "portable-wireless-bluetooth-speaker",
  "ramtons-steam-iron-with-vertical-and-variable-steam",
  "skyworth-32-inch-eye-care-google-tv-32-inch",
  "smartphone-gift-bundle-led-watch-power-bank-earbuds",
  "urban-comfort-womens-green-fleece-tracksuit",
  "vision-plus-double-door-refrigerator",
  "roch-mechanical-microwave-oven",
  "vision-plus-32-inch-full-hd-smart-tv-with-free-wall-bracket",
  "ultra-smart-watch-with-bluetooth-calling-and-ocean-strap-grey",
  "ailyons-double-burner-glass-gas-cooker-regulator-pipe",
  "kenwood-air-fryer-hfp30-000bk-3-8-litres",
  "hisense-43a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-43-inch",
  "harman-kardon-onyx-studio-9-portable-bluetooth-speaker-single-unit",
  "hisense-7-5kg-twin-tub-washing-machine-wsqb753w-7-5-kg",
  "glamstar-20l-manual-microwave-oven-black-20-litres",
  "ailyons-5l-electric-pressure-cooker-900w-10-preset-menus",
  "ailyons-2-2l-electric-kettle-luxury-dark-purple",
  "von-138l-direct-cool-double-door-fridge-silver-138-litres",
  "ipcone-16-inch-wall-mounted-fan-black-3-speed-control",
  "ecomax-2-1ch-multimedia-speaker-system-bluetooth-usb-sd",
  "abasi-5-ec",
  "alonze-50ec-abamectin-insecticide-1-litre",
  "pentagon-50ec-insecticide-1-litre",
  "zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre",
  "absolute-375sc-systemic-fungicide-greenlife-1-litres",
  "promax-20-ec-odourless-bed-bug-insecticide",
  "bayer-baraki-pellets-rat-and-mice-poison-10-g",
  "premise-200-sc-termiticide-50-ml",
  "gradometer-480ec-termiticide-1-litre",
  "metro-200sc-termiticide-25-ml",
  "syngenta-tatua-rat-and-mice-poison-blocks",
  "actellic-50ec-insecticide-1-litre",
  "bedlam-200sl-insecticide-15-ml",
  "rat-kill-pellets-25-g",
  "bromarat-0-005-rb-rodent-bait-25-g",
  "miratex-pellets-rat-and-mice-killer-bait-20-g",
  "darvin-50ew-insecticide-28-ml",
  "rodilon-wax-blocks-10-g",
  "bugnil-20ec-insecticide-25-ml",
  "actellic-25ec-insecticide-1-litre",
  "fuko-kil-rat-poison-25-g",
  "air-chopper-7-5sc-insecticide-100-ml",
  "kynofos-21-elite-feed-phosphate-25-kg",
  "gut-bio-animal-feed-supplement-100-g",
  "layer-premix-for-poultry-feed-25-kg",
  "salinomycin-coccidiostat-feed-additive-25-kg",
  "lysine-feed-amino-acid-25-kg",
  "mastercop-60sc-copper-fungicide-1-litre",
  "milthane-super-fungicide-1-kg",
  "pegasus-500sc-insecticide-1-litre",
  "rodent-kill-rat-pellets-500-g",
  "dudu-stop-25ec-bedbug-cockroach-killer-100-ml",
  "agro-lambda-5ec-insecticide-250-ml",
  "grain-save-dust-permethrin-500-g",
  "weed-out-480sl-glyphosate-herbicide-5-litres",
  "fendona-60sc-insecticide-1-litre",
  "lava-100ec-insecticide-100-ml",
  "jacto-hd-550-knapsack-sprayer-20-litres",
  "actellic-gold-dust-1-kg",
  "kelvin-dudu-dust-100-g",
  "thunder-od-145-foliar-insecticide-1-litre",
  "tecamin-max-foliar-fertilizer-1-litre"
];
assert.deepEqual(Object.keys(content).sort(), [...expected].sort(), 'Only reviewed product IDs should be present');
const allText = [];
for (const [id, sections] of Object.entries(content)) {
  assert.ok(Array.isArray(sections) && sections.length >= 2, id + ': add at least two useful sections');
  const text = sections.flatMap(s => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]).join(' ');
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  assert.ok(count >= 140 && count <= 360, id + ': supplementary content should be useful, not padded (' + count + ' words)');
  assert.ok(sections.every(s => s.heading && Array.isArray(s.paragraphs) && s.paragraphs.length), id + ': every section needs a heading and paragraphs');
  assert.ok(!/<[^>]+>/.test(text), id + ': store plain text and escape at render time');
  assert.ok(!/guaranteed|#1 rated|top-rated|certified/i.test(text), id + ': remove unsupported claims');
  allText.push(text.toLowerCase());
}
assert.equal(new Set(allText).size, allText.length, 'Product content must be distinct for every product');
console.log('OK: ' + Object.keys(content).length + ' product content entries; model-specific sections validated.');
