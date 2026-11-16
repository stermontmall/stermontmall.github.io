// Validates merchant-feed.xml for Google Merchant Center (Kenya).
//   node check-merchant-feed.mjs [file]            -> well-formed XML + required fields on every item
//   node check-merchant-feed.mjs [file] --strict   -> also requires google_product_category, the GTIN/MPN/identifier_exists rule and, when configured, KE shipping
// Exit code 1 on any error. The syntax check uses xmllint (libxml2), which GitHub's ubuntu runners include.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const file = args.find(a => !a.startsWith('--')) || 'merchant-feed.xml';
const config = JSON.parse(readFileSync(new URL('./merchant-feed.config.json', import.meta.url), 'utf8'));
const errors = [], warnings = [];
const err = m => errors.push(m);

if (!existsSync(file)) { console.error(`${file} not found`); process.exit(1); }

// 1. XML syntax
const lint = spawnSync('xmllint', ['--noout', file], { encoding: 'utf8' });
if (lint.error) { console.error('xmllint is not installed; cannot validate XML syntax.'); process.exit(1); }
if (lint.status !== 0) { console.error(`XML syntax errors in ${file}:\n${(lint.stderr || '').split('\n').slice(0, 20).join('\n')}`); process.exit(1); }

// 2. Per-item rules
const xml = readFileSync(file, 'utf8');
const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
if (!items.length) err('feed has no <item> entries');
const one = (item, tag) => { const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(item); return m ? m[1].trim() : null; };
const gtinOk = g => {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(g)) return false;
  const d = g.split('').map(Number), c = d.pop();
  let s = 0; for (let i = d.length - 1, p = 0; i >= 0; i--, p++) s += d[i] * (p % 2 === 0 ? 3 : 1);
  return (10 - (s % 10)) % 10 === c;
};
const ids = new Set();
let missingCategory = 0, withGtin = 0, withMpn = 0, noIdentifier = 0;
const excluded = new Set(config.exclude_categories || []);
const shippingConfigured = config.shipping && config.shipping.price_kes != null;

items.forEach((item, i) => {
  const id = one(item, 'g:id'), at = `item ${i + 1} (${id ?? 'no id'})`;
  if (!id) err(`${at}: missing g:id`); else if (ids.has(id)) err(`${at}: duplicate g:id`); else ids.add(id);
  const title = one(item, 'title');
  if (!title) err(`${at}: missing title`); else if (title.length > 150 * 6) err(`${at}: title too long`);
  if (!one(item, 'description')) err(`${at}: missing description`);
  if (!/^https:\/\/stermontarcade\.co\.ke\/p\//.test(one(item, 'link') || '')) err(`${at}: link must be an https stermontarcade.co.ke product URL`);
  if (!/^https:\/\//.test(one(item, 'g:image_link') || '')) err(`${at}: g:image_link must be an https URL`);
  if (!['in_stock', 'out_of_stock', 'preorder', 'backorder'].includes(one(item, 'g:availability'))) err(`${at}: bad g:availability`);
  const price = one(item, 'g:price');
  if (!/^\d+(\.\d{1,2})? KES$/.test(price || '') || parseFloat(price) <= 0) err(`${at}: g:price must look like "1500 KES"`);
  const sale = one(item, 'g:sale_price');
  if (sale && !(parseFloat(sale) < parseFloat(price))) err(`${at}: g:sale_price must be below g:price`);
  if (!one(item, 'g:brand')) err(`${at}: missing g:brand`);
  if (one(item, 'g:condition') !== 'new') err(`${at}: g:condition must be new`);
  if (/<g:shipping>/.test(item) && !/<g:shipping><g:country>KE<\/g:country>/.test(item)) err(`${at}: g:shipping must target country KE`);
  if (strict) {
    const cat = one(item, 'g:google_product_category');
    if (!cat) missingCategory++; else if (!/^\d+$/.test(cat)) err(`${at}: g:google_product_category must be the numeric taxonomy ID`);
    const gtin = one(item, 'g:gtin'), mpn = one(item, 'g:mpn'), noId = one(item, 'g:identifier_exists');
    if (gtin) { withGtin++; if (!gtinOk(gtin)) err(`${at}: invalid g:gtin ${gtin}`); }
    if (mpn) withMpn++;
    if (!gtin && !mpn) { noIdentifier++; if (noId !== 'no') err(`${at}: no gtin/mpn, so g:identifier_exists must be "no"`); }
    if ((gtin || mpn) && noId) err(`${at}: has a gtin/mpn, so g:identifier_exists must be omitted`);
    if (shippingConfigured && !/<g:shipping><g:country>KE<\/g:country>[\s\S]*?<g:price>\d+ KES<\/g:price>/.test(item)) err(`${at}: shipping is configured but g:shipping (KE) is missing`);
    if (/Cars, Trucks & Vans|<g:google_product_category>916</.test(item) || [...excluded].some(s => item.includes(`/${s}`))) err(`${at}: excluded vehicle listing present`);
  }
});
if (strict && missingCategory) {
  const msg = `${missingCategory} of ${items.length} item(s) have no g:google_product_category (category not in google-product-categories.json)`;
  // A few unmapped catch-all items (for example the 'Others' category) only warn; a widespread gap is a real failure.
  if (missingCategory > items.length * 0.02) err(msg); else warnings.push(msg);
}

warnings.forEach(w => console.warn('WARN:', w));
if (errors.length) {
  console.error(`FAIL: ${errors.length} problem(s) in ${file}:`);
  errors.slice(0, 40).forEach(e => console.error(' - ' + e));
  if (errors.length > 40) console.error(` ... and ${errors.length - 40} more`);
  process.exit(1);
}
console.log(`OK: ${items.length} items valid${strict ? ` (strict; gtin ${withGtin}, mpn ${withMpn}, identifier_exists=no ${noIdentifier}, shipping ${shippingConfigured ? 'KE configured' : 'not configured, uses Merchant Center settings'})` : ''}.`);
