// Run: node seo-titles.test.mjs   (no dependencies)
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pageTitle, pageName, applyPage } from './seo-titles.mjs';

let n = 0; const ok = (a, b, m) => { assert.equal(a, b, m); n++; };
const row = { seo_name: 'Top-Rated Absolute 375SC Systemic Fungicide', seo_title: 'Top-Rated Absolute 375SC Systemic Fungicide (1L) \u2013 Best Price in Kenya | Stermont Arcade' };
ok(pageTitle(row, false), row.seo_title);
ok(pageTitle(row, true), 'Top-Rated Absolute 375SC Systemic Fungicide \u2013 Best Price in Kenya | Stermont Arcade');
const e = { seo_name: 'Original Euroken 50x55 Standing Cooker (3G+1E)', seo_title: 'Original Euroken 50x55 Standing Cooker (3G+1E) \u2013 Best Price in Kenya | Stermont Arcade' };
ok(pageTitle(e, true), e.seo_title);
ok(pageTitle({ seo_name: 'x', seo_title: '' }, false), '');
ok(pageTitle({ seo_name: null, seo_title: row.seo_title }, true), row.seo_title);
// names
ok(pageName(row, false), 'Top-Rated Absolute 375SC Systemic Fungicide (1L)');
ok(pageName(row, true), 'Top-Rated Absolute 375SC Systemic Fungicide');
ok(pageName(e, true), 'Original Euroken 50x55 Standing Cooker (3G+1E)');
ok(pageName({ seo_name: null, seo_title: row.seo_title }, true), 'Top-Rated Absolute 375SC Systemic Fungicide (1L)');
ok(pageName({ seo_title: '' }, false), '');
const dash = { seo_name: "Trendy Men's Casual Sports Sneaker - Black", seo_title: "Trendy Men's Casual Sports Sneaker - Black \u2013 Best Price in Kenya | Stermont Arcade" };
ok(pageName(dash, false), "Trendy Men's Casual Sports Sneaker - Black");

// a page as generate-products.mjs builds it
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const page = (id, h1, size) => `<!doctype html><html><head><title>Old title</title><meta property="og:title" content="Old title"><meta name="twitter:title" content="Old title">
${ld({ '@type': 'Product', name: 'Old & name', offers: { price: '1' } })}${ld({ '@type': 'FAQPage', mainEntity: [] })}${ld({ '@type': 'BreadcrumbList', itemListElement: [{ position: 1, name: 'Home' }, { position: 2, name: 'Fungicides' }, { position: 3, name: 'Old & name' }] })}
<meta name="stm-id" content="${id}"></head><body><main><nav class="bc"><a href="/">Home</a> \u203a <a href="/c/fungicides.html">Fungicides</a> \u203a Old &amp; name</nav>
<h1>${h1}</h1>${size ? '<div class="box"><h2>Available sizes</h2></div>' : ''}</main></body></html>`;
const out = applyPage(page('a', 'Old &amp; name', true), 'T & "x" | Stermont Arcade', "Top-Rated Abc's");
assert.match(out, /<title>T &amp; &quot;x&quot; \| Stermont Arcade<\/title>/); n++;
assert.match(out, /og:title" content="T &amp; &quot;x&quot; \| Stermont Arcade">/); n++;
assert.match(out, /<h1>Top-Rated Abc&#39;s<\/h1>/); n++;
assert.match(out, /Fungicides<\/a> \u203a Top-Rated Abc&#39;s<\/nav>/); n++;
assert.match(out, /"@type":"Product","name":"Top-Rated Abc's"/); n++;
assert.match(out, /"name":"Top-Rated Abc's"\}\]\}/); n++;           // last breadcrumb item
assert.match(out, /"name":"Home"/); n++; assert.match(out, /"name":"Fungicides"/); n++;
assert.match(out, /FAQPage/); n++;
ok(applyPage(out, 'T & "x" | Stermont Arcade', "Top-Rated Abc's"), out, 'idempotent');

// end to end: run the script on a fixture folder (no network: SEO_TITLES_JSON)
const dir = mkdtempSync(join(tmpdir(), 'stt-')); mkdirSync(join(dir, 'p'));
writeFileSync(join(dir, 'p', 'abs.html'), page('abs-1l', 'Original Absolute', true));      // pack-size page, id of the earliest size, which has no title -> sibling
writeFileSync(join(dir, 'p', 'euro.html'), page('euro', 'Euroken', false));
writeFileSync(join(dir, 'p', 'none.html'), page('none', 'Untouched', false));
writeFileSync(join(dir, 'p', 'redir.html'), '<html><head><title>Redirecting</title></head></html>');
writeFileSync(join(dir, 'names.json'), JSON.stringify({ keep: 'K', 'abs-1l': 'old' }));
writeFileSync(join(dir, 'rows.json'), JSON.stringify([
  { id: 'abs-1l', variant_group: 'abs', seo_name: null, seo_title: null },
  { id: 'abs-250', variant_group: 'abs', seo_name: row.seo_name, seo_title: row.seo_title },
  { id: 'abs-50', variant_group: 'abs', seo_name: row.seo_name, seo_title: row.seo_title.replace('(1L)', '(50ml)') },
  { id: 'euro', variant_group: null, seo_name: e.seo_name, seo_title: e.seo_title },
  { id: 'none', variant_group: null, seo_name: null, seo_title: null }]));
const log = execFileSync('node', ['seo-titles.mjs'], { env: { ...process.env, P_DIR: join(dir, 'p'), NAMES_FILE: join(dir, 'names.json'), SEO_TITLES_JSON: join(dir, 'rows.json') }, encoding: 'utf8', cwd: process.cwd() });
const abs = readFileSync(join(dir, 'p', 'abs.html'), 'utf8'), eu = readFileSync(join(dir, 'p', 'euro.html'), 'utf8'), no = readFileSync(join(dir, 'p', 'none.html'), 'utf8');
console.log(log.trim());
assert.match(abs, /<title>Top-Rated Absolute 375SC Systemic Fungicide \u2013 Best Price in Kenya \| Stermont Arcade<\/title>/); n++;
assert.match(abs, /<h1>Top-Rated Absolute 375SC Systemic Fungicide<\/h1>/); n++;
assert.match(eu, /<title>Original Euroken 50x55 Standing Cooker \(3G\+1E\) \u2013 Best Price in Kenya \| Stermont Arcade<\/title>/); n++;
assert.match(eu, /<h1>Original Euroken 50x55 Standing Cooker \(3G\+1E\)<\/h1>/); n++;
assert.match(no, /<title>Old title<\/title>/); n++; assert.match(no, /<h1>Untouched<\/h1>/); n++;
const names = JSON.parse(readFileSync(join(dir, 'names.json'), 'utf8'));
ok(names.keep, 'K'); ok(names['abs-1l'], row.seo_name); ok(names['abs-250'], row.seo_name); ok(names['abs-50'], row.seo_name); ok(names.euro, e.seo_name); ok(names.none, undefined);
assert.match(log, /2 page\(s\) updated/); n++; assert.doesNotMatch(log, /whose H1 is not/); n++;
console.log(`OK: ${n} checks, 0 violations`);
