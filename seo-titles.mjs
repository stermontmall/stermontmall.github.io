// Stermont Arcade - puts the owner's exact Google titles (products.seo_title) on the built product pages.
// Source: "Master Catalog SEO Mapping" PDF, loaded into Supabase on 2026-10-29 (columns products.seo_name and products.seo_title).
// Runs in .github/workflows/product-pages.yml right after seo-overrides.mjs, so the owner's title wins over the generated one
// (description, FAQ and everything else stay as generated). Edit a title by changing products.seo_title in Supabase, the next rebuild applies it.
//
// How a page is matched: <meta name="stm-id"> holds the product id. A product with several pack sizes is ONE page that carries the id of its
// earliest size (see generate-products.mjs). If that size has no seo_title but another size of the same product has, the earliest size that has one is used.
//   - single-size page: the title is used exactly as the owner wrote it.
//   - pack-size page (it contains the "Available sizes" box): the page covers every size, so a size in brackets is left out of the title
//     (products.seo_name is the title head without it); the rest of the title is unchanged.
// Never fails the build: any problem is logged and the page keeps its generated title.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public anon key, same one generate-products.mjs uses
const DIR = process.env.P_DIR || 'p';
const SEP = ' \u2013 ';

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

async function getRows() {
  if (process.env.SEO_TITLES_JSON) return JSON.parse(readFileSync(process.env.SEO_TITLES_JSON, 'utf8'));   // local testing only
  const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,variant_group,seo_name,seo_title,created_at&order=created_at.asc`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error('Supabase answered ' + r.status);
  return r.json();
}

async function main() {
  if (!existsSync(DIR)) { console.log(`seo-titles: no ${DIR}/ folder, nothing to do.`); return; }
  const rows = await getRows();
  const byId = {}, byGroup = {};
  for (const r of rows) {
    byId[r.id] = r;
    if (r.seo_title && r.variant_group) (byGroup[r.variant_group] = byGroup[r.variant_group] || []).push(r);   // already oldest first
  }
  if (!rows.some(r => r.seo_title)) { console.log('seo-titles: no seo_title values found, nothing to do.'); return; }

  let applied = 0, same = 0, noMatch = 0, viaSibling = 0, multi = 0;
  const odd = [];
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith('.html')) continue;
    const file = `${DIR}/${f}`;
    let h = readFileSync(file, 'utf8');
    const m = h.match(/<meta name="stm-id" content="([^"]*)">/);
    if (!m) continue;                                   // redirect pages have no stm-id
    const id = unesc(m[1]);
    let row = byId[id];
    if (!(row && row.seo_title)) {
      const sib = row && row.variant_group ? byGroup[row.variant_group] : null;
      if (sib && sib.length) { row = sib[0]; viaSibling++; } else { noMatch++; continue; }
    }
    const isMulti = h.includes('>Available sizes<');
    if (isMulti) multi++;
    const title = pageTitle(row, isMulti);
    if (!title) { noMatch++; continue; }
    const t = esc(title);
    const out = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${t}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(">)/, (_, a, b) => a + t + b)
      .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (_, a, b) => a + t + b);
    if (out === h) same++; else { writeFileSync(file, out); applied++; }
    // audit: the visible H1 should start with the head of the title (the owner's name)
    const h1 = (out.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1];
    const head = title.split(SEP)[0].replace(/\s*\([^()]*\)\s*$/, '');
    if (h1 && !norm(h1).startsWith(norm(head))) odd.push(`${f}: H1 "${unesc(h1)}" vs title head "${head}"`);
  }
  console.log(`seo-titles: ${applied} page(s) updated, ${same} already correct, ${noMatch} without an owner title (left as generated); ${multi} pack-size page(s), ${viaSibling} matched through another size.`);
  if (odd.length) console.log(`seo-titles: ${odd.length} page(s) whose H1 does not start with the title head:\n  ` + odd.slice(0, 25).join('\n  '));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch(e => console.log('seo-titles skipped:', e.message));
}
