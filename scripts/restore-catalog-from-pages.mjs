#!/usr/bin/env node
// One-time restore of the product catalogue into Neon `public.products` from the generated /p/*.html pages.
// Owner approval 2026-11-23 (chat): "Rebuild from repo. Use neon, no Supabase" and "bypass trigger, go live".
//
// What it does
//   * Reads every p/<slug>.html, takes the Product JSON-LD (sku, name, category, price, image) and the
//     rendered description sections, and converts the description back to the storefront Markdown format
//     (## headings, paragraphs, "- " bullets, "Q:" FAQ lines) that product-description-html.mjs renders.
//   * Inserts in ONE transaction with trg_2_posting_rules, trg_3_guard_date_stamp and trg_5_round_prices
//     switched off, so the existing page price, stock defaults and product code are kept (the insert rules
//     would otherwise demand a cost, reprice, deactivate and round 699 to 700). They are switched back on
//     before COMMIT; trg_1_set_slug and trg_4_product_code stay on.
//   * active=true ONLY when the product has a photo that is hosted on stermontarcade.co.ke/product-photos
//     AND exists in this repo. Dead Supabase image URLs and third-party hotlinks are never stored.
//   * Never overwrites: ON CONFLICT DO NOTHING (slug or product_code already in Neon is left untouched).
//   * Withdrawn active ingredients (Acephate) are always inserted inactive (PCPB guard).
//
// Usage:
//   node scripts/restore-catalog-from-pages.mjs --dry-run            (no database; prints counts and a sample)
//   NEON_DATABASE_URL=... node scripts/restore-catalog-from-pages.mjs --apply
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const SITE_PHOTO = /^https:\/\/stermontarcade\.co\.ke\/product-photos\/([^/?#]+)$/;
const CATEGORY_ALIASES = { 'Agrovet': 'agrovet', 'Stermont Cars For Sale': 'stermont-cars-for-sale' }; // page label -> Neon slug

const ent = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n));
const text = s => ent(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

function productJson(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    let j; try { j = JSON.parse(m[1]); } catch { continue; }
    for (const x of Array.isArray(j) ? j : [j]) if (x && (x['@type'] === 'Product' || x['@type'] === 'ProductGroup')) return x;
  }
  return null;
}

function descriptionMarkdown(html) {
  const box = html.match(/<div class="box product-description pd">([\s\S]*?)<\/div>\s*(?=<|$)/);
  if (!box) return '';
  const out = [];
  for (const sec of box[1].matchAll(/<section class="product-description-section[^"]*"[^>]*>([\s\S]*?)<\/section>/g)) {
    const h = sec[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    if (!h) continue;
    const heading = text(h[1]);
    const isFaq = /frequently asked questions|^faqs?$/i.test(heading);
    const lines = [`## ${heading}`, ''];
    for (const blk of sec[1].replace(h[0], '').matchAll(/<(p|ul)[^>]*>([\s\S]*?)<\/\1>/g)) {
      if (blk[1] === 'ul') {
        for (const li of blk[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) lines.push(`- ${text(li[1])}`);
        lines.push('');
      } else if (isFaq && /<strong>/.test(blk[2])) {
        const q = text((blk[2].match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || '');
        const a = text(blk[2].replace(/<strong>[\s\S]*?<\/strong>/, ''));
        if (q) lines.push(`Q: ${q} ${a}`.trim(), '');
      } else {
        const t = text(blk[2]); if (t) lines.push(t, '');
      }
    }
    out.push(lines.join('\n').trimEnd());
  }
  return out.join('\n\n').trim();
}

const photoDir = new Set(existsSync(join(ROOT, 'product-photos')) ? readdirSync(join(ROOT, 'product-photos')) : []);
const rows = [], skipped = { noPriceOrSku: [], badDescription: [] };
for (const f of readdirSync(join(ROOT, 'p')).filter(n => n.endsWith('.html')).sort()) {
  const html = readFileSync(join(ROOT, 'p', f), 'utf8');
  const j = productJson(html);
  const offer = j && (Array.isArray(j.offers) ? j.offers[0] : j.offers);
  const price = offer && Number(offer.price);
  if (!j || !j.sku || !(price > 0)) { skipped.noPriceOrSku.push(f); continue; }
  const img = Array.isArray(j.image) ? j.image[0] : j.image;
  const photo = (img && (img.match(SITE_PHOTO) || [])[1]) || null;
  const hasPhoto = !!photo && photoDir.has(photo);
  const description = descriptionMarkdown(html);
  if (description.split(/\s+/).length < 40) skipped.badDescription.push(f);
  rows.push({
    slug: f.slice(0, -5), product_code: j.sku, name: j.name, category: j.category, price,
    description, images: hasPhoto ? [img] : [],
    meta_title: ent((html.match(/<title>([^<]*)<\/title>/) || [, ''])[1]).trim(),
    meta_description: ent((html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1]).trim(),
    active: hasPhoto && !/acephate/i.test(j.name || '')
  });
}

const summary = {
  pages: readdirSync(join(ROOT, 'p')).filter(n => n.endsWith('.html')).length,
  rows: rows.length, active: rows.filter(r => r.active).length, inactive: rows.filter(r => !r.active).length,
  skippedNoPriceOrSku: skipped.noPriceOrSku.length, thinDescription: skipped.badDescription.length,
  emptyDescription: rows.filter(r => !r.description).length
};
console.log(JSON.stringify(summary, null, 2));
if (!APPLY) { console.log('DRY RUN: no database was touched.'); process.exit(0); }

const url = process.env.NEON_DATABASE_URL;
if (!url) { console.error('NEON_DATABASE_URL is not set'); process.exit(1); }
const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: true } });
await client.connect();
const TRIGGERS = ['trg_2_posting_rules', 'trg_3_guard_date_stamp', 'trg_5_round_prices'];
try {
  const before = (await client.query('select count(*)::int n, count(*) filter (where active)::int a from public.products')).rows[0];
  const cats = new Map();
  for (const c of (await client.query('select id, lower(name) n, slug from public.categories')).rows) { cats.set(c.n, c.id); cats.set(c.slug, c.id); }
  await client.query('begin');
  for (const t of TRIGGERS) await client.query(`alter table public.products disable trigger ${t}`);
  let inserted = 0, noCategory = 0;
  for (const r of rows) {
    const cid = cats.get((r.category || '').toLowerCase()) || cats.get(CATEGORY_ALIASES[r.category] || '') || null;
    if (!cid) noCategory++;
    const res = await client.query(
      `insert into public.products (slug, product_code, name, category_id, description, price, images, meta_title, meta_description, active, featured)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false) on conflict do nothing`,
      [r.slug, r.product_code, r.name, cid, r.description, r.price, r.images, r.meta_title, r.meta_description, r.active]);
    inserted += res.rowCount;
  }
  for (const t of TRIGGERS) await client.query(`alter table public.products enable trigger ${t}`);
  await client.query(`select setval('public.products_product_code_seq', greatest((select last_value from public.products_product_code_seq), (select coalesce(max(substring(product_code from 5)::int), 0) from public.products where product_code ~ '^STM-[0-9]+$')))`);
  const bad = (await client.query(`select count(*)::int n from pg_trigger where tgrelid='public.products'::regclass and not tgisinternal and tgenabled <> 'O'`)).rows[0].n;
  if (bad) throw new Error(`${bad} product trigger(s) are not enabled; rolling back`);
  await client.query('commit');
  const after = (await client.query('select count(*)::int n, count(*) filter (where active)::int a from public.products')).rows[0];
  console.log(JSON.stringify({ before, inserted, noCategory, after }, null, 2));
} catch (e) {
  await client.query('rollback').catch(() => {});
  console.error('FAILED, rolled back:', e.message);
  process.exitCode = 1;
} finally { await client.end(); }
