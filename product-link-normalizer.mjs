// Shared final pass for generated customer-facing product links.
// Converts visible customer-facing product anchors to the mobile-shell query route while preserving
// canonical/OG metadata, JSON-LD, breadcrumbs and SEO-only /p/ crawl-link blocks.
// On generated product pages (p/) it also resolves category links written inside catalogue descriptions
// (extensionless or name-derived /c/ slugs) to a live category page, or removes the dead anchor.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { normalizeCategoryLinks } from './category-link-normalizer.mjs';
const shellProductLink = createRequire(import.meta.url)('./product-links.js');

const ROOTS = ['p', 'c', 'guides', 'blog', 'services', 'pest-control'];
const ROOT_FILES = ['index.html', 'products.html', 'fashion.html', 'cars-for-sale.html', 'checkout.html'];
// A catalogue guide or description may name a product that has no generated page (retired or never imported).
// Keep the words but drop the dead /p/ anchor so the page never links to a missing file.
const unlinkMissingProducts = html => html.replace(
  /<a\b[^>]*\bhref=(["'])(?:https?:\/\/(?:www\.)?stermontarcade\.co\.ke)?\/p\/([^\/?#"']+)\.html(?:[?#][^"']*)?\1[^>]*>([\s\S]*?)<\/a>/gi,
  (all, _q, rawSlug, label) => {
    let slug = rawSlug; try { slug = decodeURIComponent(slug); } catch {}
    return fs.existsSync(path.join('p', slug + '.html')) ? all : label;
  });
const rewriteBody = (html, categories = false, products = false) => {
  const head = [];
  let body = String(html || '').replace(/<head\b[\s\S]*?<\/head>/gi, block => { head.push(block); return ''; });
  const preserved = [];
  const preserve = re => { body = body.replace(re, block => { preserved.push(block); return `<!-- stm-preserved-${preserved.length - 1} -->`; }); };
  preserve(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);
  preserve(/<nav[^>]*class=["'][^"']*\bbc\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi);
  preserve(/<!--\s*seo-links:start\s*-->[\s\S]*?<!--\s*seo-links:end\s*-->/gi);
  preserve(/<section[^>]*class=["'][^"']*\bseo-links\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi);
  body = body.replace(/<a\b([^>]*?)\bhref=(["'])([^"']+)\2([^>]*)>/gi, (all, before, quote, href, after) => {
    const match = href.match(/^(?:https?:\/\/(?:www\.)?stermontarcade\.co\.ke)?\/p\/([^/?#]+)\.html(?:[?#].*)?$/i);
    if (!match) return all;
    let slug = match[1]; try { slug = decodeURIComponent(slug); } catch {}
    return `<a${before}href=${quote}${shellProductLink(slug)}${quote}${after}>`;
  });
  // Normalize legacy human-facing query links in existing guides/blogs through the shared mobile-shell helper.
  // Cart actions are intentionally excluded because they are functional controls with their own route state.
  body = body.replace(/<a\b([^>]*?)\bhref=(["'])([^"']+)\2([^>]*)>([\s\S]*?)<\/a>/gi, (all, before, quote, href, after, label) => {
    if (/\bdata-pack-cart\b/i.test(before + after)) return all;
    const query = href.match(/^(?:https?:\/\/(?:www\.)?stermontarcade\.co\.ke)?\/\?product=([a-z0-9][a-z0-9-]*)(?:[&#].*)?$/i);
    if (!query) return all;
    let slug = query[1]; try { slug = decodeURIComponent(slug); } catch {}
    return fs.existsSync(path.join('p', slug + '.html'))
      ? '<a' + before + 'href=' + quote + shellProductLink(slug) + quote + after + '>' + label + '</a>'
      : label;
  });
  if (categories) body = normalizeCategoryLinks(body);
  if (products) body = unlinkMissingProducts(body);
  body = body.replace(/<!-- stm-preserved-(\d+) -->/g, (_m, i) => preserved[Number(i)]);
  return head.join('') + body;
};

const walk = dir => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : (entry.isFile() && entry.name.endsWith('.html') ? [file] : []);
  });
};
export function normalizeGeneratedProductPages() {
  const files = [...new Set([...ROOT_FILES.filter(f => fs.existsSync(f)), ...ROOTS.flatMap(walk)])];
  let changed = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const top = file.split(path.sep)[0];
    const after = rewriteBody(before, top === 'p', top === 'p' || top === 'c');
    if (after !== before) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`Normalized visible product links on ${changed} generated page(s); canonical and SEO crawl URLs preserved.`);
  return changed;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) normalizeGeneratedProductPages();
