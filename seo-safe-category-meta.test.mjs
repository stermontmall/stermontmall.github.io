// Run: node seo-safe-category-meta.test.mjs (no dependencies)
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAFE_CATEGORY_META, applySafeCategoryMeta, runSafeCategoryMeta } from './seo-safe-category-meta.mjs';

let n = 0;
for (const [file, item] of Object.entries(SAFE_CATEGORY_META)) {
  assert.ok(file.endsWith('.html'));
  assert.ok(item.canonical.startsWith('https://stermontarcade.co.ke/c/'));
  assert.ok(item.title.length <= 60);
  assert.ok(item.description.length >= 70 && item.description.length <= 155);
  assert.match(item.description, /Kenya/i);
  assert.doesNotMatch(item.title + item.description, /top-quality|top\s+\w+/i);
  n += 5;
}
const item = SAFE_CATEGORY_META['appliances.html'];
const page = "<title>Old title</title><meta name='description' content='old'>" +
  "<meta property='og:description' content='old og'><meta name='twitter:description' content='old twitter'>" +
  "<link rel='canonical' href='" + item.canonical + "'><h1>Keep H1</h1>";
const out = applySafeCategoryMeta(page, item.canonical, item.title, item.description);
assert.ok(out.includes('<title>' + item.title + '</title>')); n++;
assert.ok(out.includes("name='description' content='" + item.description + "'")); n++;
assert.ok(out.includes("property='og:description' content='" + item.description + "'")); n++;
assert.ok(out.includes("name='twitter:description' content='" + item.description + "'")); n++;
assert.ok(out.includes('<h1>Keep H1</h1>')); n++;
assert.equal(applySafeCategoryMeta(page, 'https://stermontarcade.co.ke/c/not-allowlisted.html', item.title, item.description), page); n++;
assert.equal(applySafeCategoryMeta(page, item.canonical, 'Title that is too long '.repeat(4), item.description), page); n++;
assert.equal(applySafeCategoryMeta(page, item.canonical, item.title, 'too short'), page); n++;
const dir = mkdtempSync(join(tmpdir(), 'stm-safe-category-meta-'));
const cdir = join(dir, 'c'); mkdirSync(cdir);
writeFileSync(join(cdir, 'appliances.html'), page);
writeFileSync(join(cdir, 'unlisted-category.html'), page.replace(item.canonical, 'https://stermontarcade.co.ke/c/unlisted-category.html'));
runSafeCategoryMeta({ dir: cdir });
const saved = readFileSync(join(cdir, 'appliances.html'), 'utf8');
assert.ok(saved.includes('<title>' + item.title + '</title>')); n++;
assert.ok(saved.includes("name='description' content='" + item.description + "'")); n++;
assert.equal(readFileSync(join(cdir, 'unlisted-category.html'), 'utf8'), page.replace(item.canonical, 'https://stermontarcade.co.ke/c/unlisted-category.html')); n++;
assert.equal(Object.keys(SAFE_CATEGORY_META).length, 7); n++;
console.log('OK: ' + n + ' safe-category meta checks, 0 violations');
