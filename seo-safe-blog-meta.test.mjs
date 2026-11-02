// Run: node seo-safe-blog-meta.test.mjs (no dependencies)
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAFE_BLOG_META, applySafeBlogMeta, runSafeBlogMeta } from './seo-safe-blog-meta.mjs';

let n = 0;
for (const [file, item] of Object.entries(SAFE_BLOG_META)) {
  assert.ok(file.endsWith('.html'));
  assert.ok(item.canonical.startsWith('https://stermontarcade.co.ke/blog/'));
  assert.ok(item.description.length >= 70 && item.description.length <= 155);
  assert.match(item.description, /Kenya/i);
  assert.doesNotMatch(item.description, /#1|top-rated|guaranteed|certified|best price/i);
  n += 5;
}
const file = 'how-to-buy-a-phone-online-kenya.html';
const item = SAFE_BLOG_META[file];
const page = "<meta name='description' content='old'><meta property='og:description' content='old og'>" +
  "<link rel='canonical' href='" + item.canonical + "'><title>Keep title</title>";
const out = applySafeBlogMeta(page, item.canonical, item.description);
assert.ok(out.includes("name='description' content='" + item.description + "'")); n++;
assert.ok(out.includes("property='og:description' content='" + item.description + "'")); n++;
assert.ok(out.includes('<title>Keep title</title>')); n++;
assert.equal(applySafeBlogMeta(page, 'https://stermontarcade.co.ke/blog/wrong.html', item.description), page); n++;
assert.equal(applySafeBlogMeta(page, item.canonical, 'short'), page); n++;
assert.equal(applySafeBlogMeta(page, item.canonical, 'x'.repeat(156)), page); n++;
const dir = mkdtempSync(join(tmpdir(), 'stm-safe-blog-meta-'));
writeFileSync(join(dir, file), page);
runSafeBlogMeta({ dir });
const saved = readFileSync(join(dir, file), 'utf8');
assert.ok(saved.includes("name='description' content='" + item.description + "'")); n++;
assert.ok(saved.includes('<title>Keep title</title>')); n++;
assert.equal(Object.keys(SAFE_BLOG_META).length, 4); n++;
console.log('OK: ' + n + ' safe-blog meta checks, 0 violations');
