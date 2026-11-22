// Imports CSV files exported from the Supabase dashboard (Table Editor > Export to CSV) into PocketBase.
// Usage:  PB_URL=... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node pocketbase/import.mjs --dir ./exports [--all]
// Files looked for in --dir: categories.csv products.csv vouchers.csv orders.csv reviews.csv product_slug_redirects.csv
// By default only ACTIVE products that have at least one photo are imported (use --all to import every product).
// Safe to re-run: rows that already exist (same key) are skipped, so it resumes after an interruption.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, pgArray, toBool, toNum, toText, toJson, toDate } from './csv.mjs';

const PB = (process.env.PB_URL || '').replace(/\/+$/, '');
const EMAIL = process.env.PB_ADMIN_EMAIL, PASSWORD = process.env.PB_ADMIN_PASSWORD;
const args = process.argv.slice(2);
const DIR = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : './exports';
const ALL = args.includes('--all');
if (!PB || !EMAIL || !PASSWORD) { console.error('Set PB_URL, PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD first.'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
let token = '', batchWorks = true;

async function call(path, { method = 'GET', body } = {}) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(PB + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (r.status === 429 && attempt < 6) { const wait = Number(r.headers.get('retry-after')) || 60; console.log(`  rate limited, waiting ${wait}s...`); await sleep(wait * 1000); continue; }
    const text = await r.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { status: r.status, data };
  }
}

async function login() {
  for (const path of ['/api/collections/_superusers/auth-with-password', '/api/admins/auth-with-password']) {
    const r = await call(path, { method: 'POST', body: { identity: EMAIL, password: PASSWORD } });
    if (r.status === 200 && r.data.token) { token = r.data.token; return; }
  }
  throw new Error('Could not sign in as the PocketBase admin.');
}

function readCsv(name) {
  const file = join(DIR, name + '.csv');
  if (!existsSync(file)) { console.log(`skip      ${name}.csv not found in ${DIR}`); return null; }
  return parseCsv(readFileSync(file, 'utf8'));
}

async function existingKeys(collection, keyFn, fields) {
  const keys = new Set();
  for (let page = 1; ; page++) {
    const r = await call(`/api/collections/${collection}/records?perPage=500&page=${page}&fields=${fields}&skipTotal=1`);
    if (r.status !== 200) throw new Error(`Cannot read ${collection} (HTTP ${r.status}). Did you run setup.mjs first?\n${JSON.stringify(r.data).slice(0, 300)}`);
    for (const rec of r.data.items) keys.add(keyFn(rec));
    if (r.data.items.length < 500) break;
  }
  return keys;
}

async function insertAll(collection, records, keyFn, fields) {
  const have = await existingKeys(collection, keyFn, fields);
  const todo = records.filter(r => !have.has(keyFn(r)));
  console.log(`${collection}: ${records.length} in file, ${have.size} already there, importing ${todo.length}`);
  let done = 0, failed = 0;
  for (let i = 0; i < todo.length; i += 50) {
    const chunk = todo.slice(i, i + 50);
    let results = null;
    if (batchWorks) {
      const r = await call('/api/batch', { method: 'POST', body: { requests: chunk.map(body => ({ method: 'POST', url: `/api/collections/${collection}/records`, body })) } });
      if (r.status === 200 && Array.isArray(r.data)) results = r.data.map(x => ({ ok: x.status >= 200 && x.status < 300, info: x.body }));
      else { batchWorks = false; console.log(`  batch API unavailable (HTTP ${r.status}); using single requests (slower).`); }
    }
    if (!results) {
      results = [];
      for (const body of chunk) { const r = await call(`/api/collections/${collection}/records`, { method: 'POST', body }); results.push({ ok: r.status >= 200 && r.status < 300, info: r.data }); }
    }
    for (const x of results) { if (x.ok) done++; else { failed++; if (failed <= 3) console.log('  failed row:', JSON.stringify(x.info).slice(0, 300)); } }
    process.stdout.write(`  ${done + failed}/${todo.length}\r`);
  }
  console.log(`${collection}: imported ${done}, failed ${failed}                `);
  return { done, failed };
}

const mapCategory = r => ({ cat_id: toNum(r.id), name: toText(r.name), slug: toText(r.slug), parent_id: toNum(r.parent_id), sort_order: toNum(r.sort_order), is_promo: toBool(r.is_promo),
  top_label: toText(r.top_label), top_sort: toNum(r.top_sort), image_url: toText(r.image_url), description: toText(r.description), meta_title: toText(r.meta_title),
  meta_description: toText(r.meta_description), keywords: pgArray(r.keywords) });

const mapProduct = r => ({ pid: toText(r.id), category_id: toNum(r.category_id), name: toText(r.name), price: toNum(r.price), stock: toNum(r.stock), low_at: toNum(r.low_at),
  featured: toBool(r.featured), active: toBool(r.active), images: pgArray(r.images), description: toText(r.description), old_price: toNum(r.old_price), unit: toText(r.unit),
  variant_group: toText(r.variant_group), variant_label: toText(r.variant_label), slug: toText(r.slug), seo_name: toText(r.seo_name), seo_title: toText(r.seo_title),
  gtin: toText(r.gtin), mpn: toText(r.mpn), meta_title: toText(r.meta_title), meta_description: toText(r.meta_description), alt_text: toText(r.alt_text),
  keywords: pgArray(r.keywords), stock_status: toText(r.stock_status), product_code: toText(r.product_code), created_at: toDate(r.created_at) });

const mapVoucher = r => ({ code: toText(r.code), kind: toText(r.kind), value: toNum(r.value), min_order: toNum(r.min_order), max_uses: toNum(r.max_uses), used_count: toNum(r.used_count),
  starts_at: toDate(r.starts_at), expires_at: toDate(r.expires_at), active: toBool(r.active), public_offer: toBool(r.public_offer), note: toText(r.note),
  created_by: toText(r.created_by), first_order_only: toBool(r.first_order_only) });

const mapOrder = r => ({ ref: toText(r.ref), user_id: toText(r.user_id), customer_name: toText(r.customer_name), phone: toText(r.phone), email: toText(r.email), method: toText(r.method),
  county: toText(r.county), address: toText(r.address), notes: toText(r.notes), items: toJson(r.items) ?? [], subtotal: toNum(r.subtotal), status: toText(r.status),
  handled_by: toText(r.handled_by), handled_at: toDate(r.handled_at), stage: toText(r.stage), pay_code: toText(r.pay_code), pay_amount: toNum(r.pay_amount),
  voucher_code: toText(r.voucher_code), discount: toNum(r.discount), pay_verified: toBool(r.pay_verified), review_key: toText(r.review_key), created_at: toDate(r.created_at) });

const mapReview = r => ({ user_id: toText(r.user_id), order_ref: toText(r.order_ref), product_name: toText(r.product_name), rating: toNum(r.rating), body: toText(r.body),
  reviewer: toText(r.reviewer), status: toText(r.status), created_at: toDate(r.created_at) });

await login();
console.log('signed in to', PB, ALL ? '(importing ALL products)' : '(active products with photos only)');

const cats = readCsv('categories');
if (cats) await insertAll('categories', cats.map(mapCategory), r => String(r.cat_id), 'cat_id');

const prods = readCsv('products');
if (prods) {
  let list = prods.map(mapProduct);
  if (!ALL) { const before = list.length; list = list.filter(p => p.active && p.images.length); console.log(`products: keeping ${list.length} of ${before} (active with photos)`); }
  await insertAll('products', list, r => r.pid, 'pid');
  // Wholesale cost goes to its own staff-only collection (never public).
  const kept = new Set(list.map(p => p.pid));
  const costs = prods.filter(r => kept.has(r.id)).map(r => ({ pid: toText(r.id), cost: toNum(r.cost) }));
  await insertAll('product_costs', costs, r => r.pid, 'pid');
}

const vouchers = readCsv('vouchers'); if (vouchers) await insertAll('vouchers', vouchers.map(mapVoucher), r => r.code, 'code');
const orders = readCsv('orders'); if (orders) await insertAll('orders', orders.map(mapOrder), r => r.ref, 'ref');
const reviews = readCsv('reviews'); if (reviews) await insertAll('reviews', reviews.map(mapReview), r => r.order_ref + '|' + r.product_name, 'order_ref,product_name');
const redirects = readCsv('product_slug_redirects');
if (redirects) await insertAll('product_slug_redirects', redirects.map(r => ({ old_slug: toText(r.old_slug), product_id: toText(r.product_id) })), r => r.old_slug, 'old_slug');

console.log('\nImport finished.');
