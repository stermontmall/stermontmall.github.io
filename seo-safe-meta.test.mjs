// Run: node seo-safe-meta.test.mjs (no dependencies)
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAFE_META, applySafeMeta, runSafeMeta } from './seo-safe-meta.mjs';

let n = 0;
for (const [file, item] of Object.entries(SAFE_META)) {
  assert.ok(file.endsWith('.html'));
  assert.ok(item.id && item.description.length >= 70 && item.description.length <= 155);
  assert.match(item.description, /Kenya/i);
  assert.match(item.description, /M-Pesa/i);
  assert.doesNotMatch(item.description, /#1|top-rated|guaranteed|certified|best price/i);
  n += 5;
}
const id = SAFE_META['samsung-galaxy-a06-4gb-ram-64gb.html'].id;
const desc = SAFE_META['samsung-galaxy-a06-4gb-ram-64gb.html'].description;
const page = '<meta name="stm-id" content="' + id + '">' +
  '<title>Keep title</title><meta name="description" content="old">' +
  '<meta property="og:description" content="old og"><meta name="twitter:description" content="old twitter">' +
  '<link rel="canonical" href="https://stermontarcade.co.ke/p/example.html">';
const out = applySafeMeta(page, id, desc);
assert.ok(out.includes('<meta name="description" content="' + desc + '">')); n++;
assert.ok(out.includes('<meta property="og:description" content="' + desc + '">')); n++;
assert.ok(out.includes('<meta name="twitter:description" content="' + desc + '">')); n++;
assert.ok(out.includes('<title>Keep title</title>')); n++;
assert.ok(out.includes('rel="canonical" href="https://stermontarcade.co.ke/p/example.html"')); n++;
assert.equal(applySafeMeta(page, 'wrong-id', desc), page); n++;
assert.equal(applySafeMeta(page, id, 'too short'), page); n++;
assert.equal(applySafeMeta(page, id, 'x'.repeat(156)), page); n++;
assert.equal(Object.keys(SAFE_META).length, 11); n++;
for (const file of ['asus-zenbook-14-oled-laptop.html', 'classic-mens-black-formal-blazer.html']) {
  const item = SAFE_META[file];
  const fixture = '<meta name="stm-id" content="' + item.id + '">' +
    '<meta name="description" content="old"><meta property="og:description" content="old">' +
    '<meta name="twitter:description" content="old">';
  const result = applySafeMeta(fixture, item.id, item.description);
  assert.ok(result.includes('<meta name="description" content="' + item.description + '">'));
  assert.ok(result.includes('<meta property="og:description" content="' + item.description + '">'));
  assert.ok(result.includes('<meta name="twitter:description" content="' + item.description + '">'));
  assert.doesNotMatch(result, /genuine|top-quality/i);
  n += 4;
}

// Exercise the actual pass with a fixture and verify it only touches the allowlisted file.
const dir = mkdtempSync(join(tmpdir(), 'stm-safe-meta-'));
const pdir = join(dir, 'p'); mkdirSync(pdir);
writeFileSync(join(pdir, 'samsung-galaxy-a06-4gb-ram-64gb.html'), page);
runSafeMeta({ dir: pdir });
const saved = readFileSync(join(pdir, 'samsung-galaxy-a06-4gb-ram-64gb.html'), 'utf8');
assert.ok(saved.includes('<meta name="description" content="' + desc + '">')); n++;
assert.ok(saved.includes('<title>Keep title</title>')); n++;
console.log('OK: ' + n + ' safe-product meta checks, 0 violations');
