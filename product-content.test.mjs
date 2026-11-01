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
  "vitron-htc4300qfs-qled-android-smart-tv-with-wall-mount-43-inch"
];
assert.deepEqual(Object.keys(content).sort(), [...expected].sort(), 'Only reviewed product IDs should be present');
const allText = [];
for (const [id, sections] of Object.entries(content)) {
  assert.ok(Array.isArray(sections) && sections.length >= 2, id + ': add at least two useful sections');
  const text = sections.flatMap(s => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]).join(' ');
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  assert.ok(count >= 140 && count <= 240, id + ': supplementary content should be useful, not padded (' + count + ' words)');
  assert.ok(sections.every(s => s.heading && Array.isArray(s.paragraphs) && s.paragraphs.length), id + ': every section needs a heading and paragraphs');
  assert.ok(!/<[^>]+>/.test(text), id + ': store plain text and escape at render time');
  assert.ok(!/guaranteed|#1 rated|top-rated|certified/i.test(text), id + ': remove unsupported claims');
  allText.push(text.toLowerCase());
}
assert.notEqual(allText[0], allText[1], 'Product content must be distinct');
assert.notEqual(allText[1], allText[2], 'Product content must be distinct');
console.log('OK: ' + Object.keys(content).length + ' product content entries; model-specific sections validated.');
