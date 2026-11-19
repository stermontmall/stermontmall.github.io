import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import shellProductLink from './product-links.js';

const SITE = 'https://stermontarcade.co.ke';
const ROOTS = ['p', 'c', 'blog', 'guides', 'pest-control', 'services'];
const ROOT_FILES = readdirSync('.').filter(name => name.endsWith('.html') && name !== ['classic', 'html'].join('.'));
const MARKER = '<!-- stm-shell-product-links:v1 -->';
const PROTECTED = [
  /<head\b[^>]*>[\s\S]*?<\/head>/gi,
  /<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi,
  /<!--\s*seo-links:start\s*-->[\s\S]*?<!--\s*seo-links:end\s*-->/gi,
  /<nav\b[^>]*class=["'][^"']*(?:breadcrumb|\bbc\b)[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi
];

function protect(html) {
  const saved = [];
  for (const pattern of PROTECTED) {
    html = html.replace(pattern, block => {
      const token = '<!--stm-protected-seo-' + saved.length + '-->';
      saved.push(block);
      return token;
    });
  }
  return { html, restore(value) {
    return value.replace(/<!--stm-protected-seo-(\d+)-->/g, (_m, i) => saved[Number(i)]);
  }};
}

export function rewriteHtml(source) {
  const protectedParts = protect(source);
  let replaced = 0;
  let html = protectedParts.html.replace(/(?:https?:\/\/stermontarcade\.co\.ke)?\/p\/([a-z0-9-]+)\.html(?:[?#][^"'\s]*)?/gi, (_m, slug) => {
    replaced++;
    return shellProductLink(decodeURIComponent(slug), SITE);
  });
  html = html.replace(/https%3A%2F%2Fstermontarcade\.co\.ke%2Fp%2F([a-z0-9-]+)\.html/gi, (_m, slug) => {
    replaced++;
    return encodeURIComponent(shellProductLink(decodeURIComponent(slug), SITE));
  });
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = [...ROOT_FILES.filter(f => { try { return statSync(f).isFile(); } catch { return false; } })];
  for (const dir of ROOTS) {
    try { files.push(...walk(dir)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  let total = 0, changedFiles = 0;
  for (const file of [...new Set(files)]) {
    const before = readFileSync(file, 'utf8');
    const result = rewriteHtml(before);
    if (!result.replaced || result.html === before) continue;
    if (!before.includes(MARKER)) result.html = result.html.replace(/<body\b[^>]*>/i, match => match + MARKER);
    writeFileSync(file, result.html);
    total += result.replaced;
    changedFiles++;
    console.log(relative('.', file) + ': ' + result.replaced + ' customer link(s) migrated');
  }
  console.log('Shell product-link migration: ' + total + ' link(s) across ' + changedFiles + ' HTML file(s). SEO head, JSON-LD, breadcrumbs and seo-links blocks were preserved.');
}
