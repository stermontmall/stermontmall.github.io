// Shared final pass for generated customer-facing product links.
// Rewrites visible /p/<slug>.html anchors to the mobile shell while preserving
// canonical/OG metadata, JSON-LD, breadcrumbs and SEO-only crawl-link blocks.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const shellProductLink = createRequire(import.meta.url)('./product-links.js');

const ROOTS = ['p', 'c', 'guides', 'blog', 'services', 'pest-control'];
const ROOT_FILES = ['index.html', 'products.html', 'fashion.html', 'cars-for-sale.html', 'checkout.html'];
const rewriteBody = html => {
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
    const after = rewriteBody(before);
    if (after !== before) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`Normalized visible product links on ${changed} generated page(s); canonical and SEO crawl URLs preserved.`);
  return changed;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) normalizeGeneratedProductPages();
