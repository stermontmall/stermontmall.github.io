// Stermont Arcade - puts the owner's exact Google titles AND names (products.seo_title / products.seo_name) on the built product pages.
// Source: "Master Catalog SEO Mapping" PDF, loaded into Supabase on 2026-10-29 (columns products.seo_name and products.seo_title).
// Runs in .github/workflows/product-pages.yml right after seo-overrides.mjs, so the owner's wording wins over the generated one
// (description, FAQ and everything else stay as generated). Edit a title by changing products.seo_title in Supabase, the next rebuild applies it.
//
// What is changed on a matched page:
//   - <title>, og:title, twitter:title      = the owner's title
//   - the visible <h1> and the last crumb   = the owner's name (the title up to " - ")
//   - JSON-LD Product / ProductGroup name and the last BreadcrumbList item
//   - product-names.json (the shop list and the shop product view read it) for the page id and every pack size of it
//
// How a page is matched: <meta name="stm-id"> holds the product id. A product with several pack sizes is ONE page that carries the id of its
// earliest size (see generate-products.mjs). If that size has no seo_title but another size of the same product has, the earliest size that has one is used.
//   - single-size page: the title is used exactly as the owner wrote it, the name is the title head (size in brackets kept).
//     If the title has no " - " in it (e.g. "Name 1L | Ingredient | KSh 1,800"), the name is products.seo_name, so "|" never reaches the H1.
//   - pack-size page (it contains the "Available sizes" box): the page covers every size, so a size in brackets is left out of the title and name
//     (products.seo_name is the title head without it); the rest of the title is unchanged.
// Length limit (added 2026-10-30, branch wip-seo-title-length): the daily SEO check flags a <title> longer than 75 characters and Google cuts
// long titles off, but most of the owner's titles are 80-97 characters. fitTitle() shortens ONLY what goes into <title>, og:title and twitter:title,
// in this order, stopping at the first step that fits: (1) drop the " | Stermont Arcade" brand tail, (2) "Best Price in Kenya" -> "Price in Kenya",
// (3) drop the " \u2013 ..." tail, (4) cut at a word boundary. The owner's products.seo_title / seo_name in Supabase and the visible H1 are never changed,
// the lead word and the product name always stay. Set SEO_TITLE_MAX=0 to switch it off (the titles are then applied exactly as written).
// Never fails the build: any problem is logged and the page keeps its generated wording.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public anon key, same one generate-products.mjs uses
const DIR = process.env.P_DIR || 'p';
const NAMES_FILE = process.env.NAMES_FILE || 'product-names.json';
const SEP = ' \u2013 ';
const BRAND = ' | Stermont Arcade';
const MAX_TITLE = process.env.SEO_TITLE_MAX === undefined ? 75 : Number(process.env.SEO_TITLE_MAX);   // 0 = no limit

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const norm = s => unesc(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Title for a page. Exported so it can be unit-tested (seo-titles.test.mjs).
export function pageTitle(row, multiSize) {
  const full = String(row.seo_title || '').trim();
  if (!full) return '';
  if (!multiSize) return full;
  const i = full.indexOf(SEP);
  const head = String(row.seo_name || '').trim();
  return i > 0 && head ? head + full.slice(i) : full;
}

// Shortens a title to at most `max` characters (see the header comment for the order). A title that already fits is returned unchanged.
export function fitTitle(title, max = MAX_TITLE) {
  let t = String(title || '').trim();
  if (!max || t.length <= max) return t;
  if (t.endsWith(BRAND)) t = t.slice(0, -BRAND.length).trim();
  if (t.length <= max) return t;
  const price = t.replace(/ \u2013 Best Price in Kenya$/, ' \u2013 Price in Kenya');
  if (price.length <= max) return price;
  const i = t.lastIndexOf(SEP);
  if (i > 0) { t = t.slice(0, i).trim(); if (t.length <= max) return t; }
  let c = t.slice(0, max);
  if (t[max] !== ' ') c = c.replace(/\s+\S*$/, '');                                    // do not leave half a word
  const open = c.lastIndexOf('(');
  if (open > 0 && open > c.lastIndexOf(')')) c = c.slice(0, open);                  // or an unclosed bracket
  return c.replace(/[\s,;:(\[\u2013-]+$/, '');
}

// Visible name (H1) for a page: the title up to " - "; on a pack-size page products.seo_name (no size in brackets) when it is set.
// A single-size title without " - " uses products.seo_name when it is set (otherwise the whole title, as before).
export function pageName(row, multiSize) {
  const full = String(row.seo_title || '').trim();
  if (!full) return '';
  const i = full.indexOf(SEP);
  const head = i > 0 ? full.slice(0, i).trim() : full;
  const own = String(row.seo_name || '').trim();
  if (multiSize) return own || head;
  return i > 0 ? head : (own || head);
}

// Rewrites one built product page. Exported for tests.
export function applyPage(h, title, name) {
  const t = esc(title), n = esc(name);
  return h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${t}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, (_, a, b) => a + t + b)
    .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (_, a, b) => a + t + b)
    .replace(/<h1>[\s\S]*?<\/h1>/, () => `<h1>${n}</h1>`)
    .replace(/(<nav class="bc">[\s\S]*? \u203a )([^<\u203a]*)(<\/nav>)/, (_, a, b, c) => a + n + c)
    .replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, j) => {
      try {
        const o = JSON.parse(j);
        if (o && (o['@type'] === 'Product' || o['@type'] === 'ProductGroup')) o.name = name;
        else if (o && o['@type'] === 'BreadcrumbList' && Array.isArray(o.itemListElement) && o.itemListElement.length) o.itemListElement[o.itemListElement.length - 1].name = name;
        else return all;
        return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
      } catch { return all; }
    });
}

async function getRows() {
  if (process.env.SEO_TITLES_JSON) return JSON.parse(readFileSync(process.env.SEO_TITLES_JSON, 'utf8'));   // local testing only
  const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,variant_group,seo_name,seo_title,created_at&order=created_at.asc`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error('Supabase answered ' + r.status);
  return r.json();
}

async function main() {
  if (!existsSync(DIR)) { console.log(`seo-titles: no ${DIR}/ folder, nothing to do.`); return; }
  const rows = await getRows();
  const byId = {}, byGroup = {}, groupAll = {};
  for (const r of rows) {
    byId[r.id] = r;
    if (r.variant_group) (groupAll[r.variant_group] = groupAll[r.variant_group] || []).push(r.id);
    if (r.seo_title && r.variant_group) (byGroup[r.variant_group] = byGroup[r.variant_group] || []).push(r);   // already oldest first
  }
  if (!rows.some(r => r.seo_title)) { console.log('seo-titles: no seo_title values found, nothing to do.'); return; }

  let applied = 0, same = 0, noMatch = 0, viaSibling = 0, multi = 0, shortened = 0;
  const odd = [], nameOf = {};
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith('.html')) continue;
    const file = `${DIR}/${f}`;
    const h = readFileSync(file, 'utf8');
    const m = h.match(/<meta name="stm-id" content="([^"]*)">/);
    if (!m) continue;                                   // redirect pages have no stm-id
    const id = unesc(m[1]);
    const own = byId[id];
    let row = own;
    if (!(row && row.seo_title)) {
      const sib = row && row.variant_group ? byGroup[row.variant_group] : null;
      if (sib && sib.length) { row = sib[0]; viaSibling++; } else { noMatch++; continue; }
    }
    const isMulti = h.includes('>Available sizes<');
    if (isMulti) multi++;
    const full = pageTitle(row, isMulti), name = pageName(row, isMulti);
    if (!full || !name) { noMatch++; continue; }
    const title = fitTitle(full);
    if (title !== full) shortened++;
    const out = applyPage(h, title, name);
    if (out === h) same++; else { writeFileSync(file, out); applied++; }
    for (const x of [id, ...((own && own.variant_group && groupAll[own.variant_group]) || [])]) nameOf[x] = name;
    // audit: the visible H1 must now be the owner's name
    const h1 = (out.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1];
    if (!h1 || norm(h1) !== norm(name)) odd.push(`${f}: H1 "${unesc(h1)}" vs name "${name}"`);
  }
  // the shop list and the shop product view read product-names.json (id -> heading), so they carry the same names as the pages
  let listed = 0;
  if (existsSync(NAMES_FILE)) {
    try {
      const names = JSON.parse(readFileSync(NAMES_FILE, 'utf8') || '{}');
      for (const [k, v] of Object.entries(nameOf)) if (names[k] !== v) { names[k] = v; listed++; }
      if (listed) writeFileSync(NAMES_FILE, JSON.stringify(names));
    } catch (e) { console.log('seo-titles: could not update ' + NAMES_FILE + ': ' + e.message); }
  } else console.log(`seo-titles: ${NAMES_FILE} not found, shop list keeps database names.`);
  console.log(`seo-titles: ${applied} page(s) updated, ${same} already correct, ${noMatch} without an owner title (left as generated); ${multi} pack-size page(s), ${viaSibling} matched through another size; ${listed} shop-list name(s) set; ${shortened} title(s) shortened to ${MAX_TITLE || 'no'} characters or less.`);
  if (odd.length) console.log(`seo-titles: ${odd.length} page(s) whose H1 is not the owner's name:\n  ` + odd.slice(0, 25).join('\n  '));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch(e => console.log('seo-titles skipped:', e.message));
}
