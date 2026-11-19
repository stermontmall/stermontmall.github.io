import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import shellProductLink from './product-links.js';

const SITE = 'https://stermontarcade.co.ke';
const ROOTS = ['p', 'c', 'blog', 'guides', 'pest-control', 'services'];
const ROOT_FILES = ['index.html', 'products.html'];
const MARKER = '<!-- stm-shell-product-links:v1 -->';
const SEO_LINKS = /<!--\\s*seo-links:start\\s*-->[\\s\\S]*?<!--\\s*seo-links:end\\s*-->/gi;
const BREADCRUMBS = /<nav\\b[^>]*(?:class=["'][^"']*(?:breadcrumb|\\bbc\\b)[^"']*["'])[^>]*>[\\s\\S]*?<\\/nav>/gi;
const HEAD = /<head\\b[^>]*>[\\s\\S]*?<\\/head>/gi;
const JSON_LD = /<script\\b(?=[^>]*type=["']application\\/ld\\+json["'])[^>]*>[\\s\\S]*?<\\/script>/gi;

function protect(html) {
  const saved = [];
  const protectedHtml = html.replace(new RegExp([HEAD.source, JSON_LD.source, SEO_LINKS.source, BREADCRUMBS.source].join('|'), 'gi'), block => {
    const token = '<!--stm-protected-seo-' + saved.length + '-->';
    saved.push(block);
    return token;
  });
  return { html: protectedHtml, restore(value) { return value.replace(/<!--stm-protected-seo-(\\d+)-->/g, (_m, i) => saved[Number(i)]); } };
}

export function rewriteHtml(source) {
  const protectedParts = protect(source);
  let replaced = 0;
  let html = protectedParts.html.replace(/<a\\b[^>]*>/gi, tag => tag.replace(/\\bhref=(["'])(.*?)\\1/i, (attr, quote, href) => {
    const match = href.match(/^(?:https?:\\/\\/stermontarcade\\.co\\.ke)?\\/p\\/([a-z0-9-]+)\\.html(?:[?#].*)?$/i);
    if (!match) return attr;
    replaced++;
    return 'href=' + quote + shellProductLink(decodeURIComponent(match[1]), SITE) + quote;
  }));
  html = protectedParts.restore(html);
  return { html, replaced };
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'assets' || name === 'product-photos') continue;
    const path = join(dir, name), st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (name.endsWith('.html') && st.size < 3_000_000) out.push(path);
  }
  return out;
}

const files = [...ROOT_FILES.filter(f => { try { return statSync(f).isFile(); } catch { return false; } })];
for (const dir of ROOTS) {
  try { files.push(...walk(dir)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
let total = 0, changedFiles = 0;
for (const file of [...new Set(files)]) {
  const before = readFileSync(file, 'utf8');
  const result = rewriteHtml(before);
  if (!result.replaced || result.html === before) continue;
  if (!before.includes(MARKER)) result.html = result.html.replace(/<body\\b[^>]*>/i, match => match + MARKER);
  writeFileSync(file, result.html);
  total += result.replaced;
  changedFiles++;
  console.log(relative('.', file) + ': ' + result.replaced + ' customer link(s) migrated');
}
console.log('Shell product-link migration: ' + total + ' link(s) across ' + changedFiles + ' HTML file(s). SEO head, JSON-LD, breadcrumbs and seo-links blocks were preserved.');
