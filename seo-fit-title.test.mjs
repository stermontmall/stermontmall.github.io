// Run: node seo-fit-title.test.mjs
import assert from 'node:assert/strict';
import { fitStoredTitle } from './seo-meta.mjs';
const long = 'Mortein Doom Aiko Odourless Insect Killer 400ml + 200ml | Price in Kenya | Stermont Arcade';
assert.equal(fitStoredTitle(long, 'G'), 'Mortein Doom Aiko Odourless Insect Killer 400ml + 200ml | Price in Kenya');
assert.equal(fitStoredTitle('Short Price in Kenya | Stermont Arcade', 'G'), 'Short Price in Kenya | Stermont Arcade');
assert.equal(fitStoredTitle('Mavuno Fruits and Garden Vegetables Fertilizer NPK 15:10:22 50kg Price in Kenya', 'G'), 'Mavuno Fruits and Garden Vegetables NPK 15:10:22 50kg Price in Kenya');
assert.equal(fitStoredTitle('x'.repeat(90), 'G'), 'G');
assert.equal(fitStoredTitle('', 'G'), 'G');
console.log('Stored title length checks passed.');
