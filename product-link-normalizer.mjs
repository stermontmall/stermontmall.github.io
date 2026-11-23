// Shared final pass for generated product links.
// Rewrites legacy ?product= anchors to sitemap /p/<slug>.html URLs.
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
    const staticMatch = href.match(/^(?:https?:\\/\\/(?:www\\.)?stermontarcade\\.co\\.ke)?\\/p\\/([^/?#]+)\\.html(?:[?#].*)?$/i);
    let slug = staticMatch ? staticMatch[1] : '';
    if (!slug) { try { const u = new URL(href, 'https://stermontarcade.co.ke'); if (u.origin === 'https://stermontarcade.co.ke' && u.pathname === '/') slug = u.searchParams.get('product') || ''; } catch {} }
    if (!slug) return all;
    try { slug = decodeURIComponent(slug); } catch {}
    return '<a' + before + 'href=' + quote + shellProductLink(slug) + quote + after + '>';
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
  console.log(`Normalized legacy product links on ${changed} generated page(s); canonical and SEO crawl URLs preserved.`);
  return changed;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) normalizeGeneratedProductPages();
