// Run: node seo-blog-titles.test.mjs (no dependencies)
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeBlogTitles } from './seo-blog-titles.mjs';

const dir = mkdtempSync(join(tmpdir(), 'stm-blog-titles-'));
const longTitle = 'Best Insect Killer Machine for Hotels in Kenya | Stermont Arcade';
const h1 = 'Best Insect Killer Machine for Hotels in Kenya';
writeFileSync(join(dir, 'long.html'),
  '<title>' + longTitle + '</title><meta property="og:title" content="' + longTitle +
  '"><meta name="twitter:title" content="' + longTitle + '"><h1>' + h1 + '</h1>');
writeFileSync(join(dir, 'restore.html'),
  '<title>Old title cut short…</title><meta property="og:title" content="Old title cut short…"><h1>How to choose a fridge in Kenya</h1>');
writeFileSync(join(dir, 'skip.html'),
  '<meta name="robots" content="noindex"><title>A deliberately long noindex title that should remain as it is | Stermont Arcade</title>');
assert.equal(normalizeBlogTitles({ dir }), 2);
const long = readFileSync(join(dir, 'long.html'), 'utf8');
const title = long.match(/<title>(.*?)<\\/title>/)[1];
assert.ok(title.length <= 60);
assert.ok(long.includes('<h1>' + h1 + '</h1>'));
assert.ok(long.includes('content="' + title + '"'));
const restored = readFileSync(join(dir, 'restore.html'), 'utf8');
assert.ok(restored.includes('<title>How to choose a fridge in Kenya | Stermont Arcade</title>'));
assert.ok(restored.includes('<h1>How to choose a fridge in Kenya</h1>'));
assert.ok(readFileSync(join(dir, 'skip.html'), 'utf8').includes('noindex title that should remain'));
console.log('OK: concise blog title checks passed');
