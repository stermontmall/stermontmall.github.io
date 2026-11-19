// One-time/repeatable generated-HTML migration for customer-facing product anchors.
// Only <a href="/p/<slug>.html"> links are rewritten. Canonical, og:url, JSON-LD,
// sitemap files, breadcrumb navs and the marked seo-links crawl block are preserved.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import shellProductLink from './product-links.js';

const GENERATED_DIRS = ['p', 'c', 'blog', 'guides', 'services', 'pest-control'];
const MARKER = '<!-- stm-shell-product-links:v1 -->';

export function rewriteHtml(source) {
  let html = String(source || ''), replaced = 0;
  const protectedBlocks = [];
  const protect = pattern => {
    html = html.replace(pattern, block => {
      const token = '__STM_PROTECTED_' + protectedBlocks.length + '__';
      protectedBlocks.push(block);
      return token;
    });
  };
  protect(/<!--\s*seo-links:start\s*-->[\s\S]*?<!--\s*seo-links:end\s*-->/gi);
  protect(/<nav\b[^>]*class=["'][^"']*\bbc\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi);
  html = html.replace(/(<a\b[^>]*\bhref\s*=\s*)(["'])(?:https?:\/\/stermontarcade\.co\.ke)?\/p\/([a-z0-9-]+)\.html\2/gi,
    (_match, prefix, quote, slug) => {
      replaced++;
      return prefix + quote + shellProductLink(slug) + quote;
    });
  html = html.replace(/__STM_PROTECTED_(\d+)__/g, (_m, index) => protectedBlocks[Number(index)]);
  if (!html.includes(MARKER)) {
    html = html.replace(/<head\b[^>]*>/i, match => match + MARKER);
  }
  return { html, replaced };
}

function walk(dir, out = []) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name === '.git' || name === 'node_modules') continue;
    const path = join(dir, name), stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else if (name.endsWith('.html') && stat.size < 5_000_000) out.push(path);
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('rewrite-static-product-links.mjs')) {
  let files = 0, changed = 0, replaced = 0;
  const targets = GENERATED_DIRS.flatMap(dir => walk(dir));
  targets.push(...walk('.').filter(path => !GENERATED_DIRS.some(dir => path.startsWith(dir + '/'))));
  for (const file of [...new Set(targets)]) {
    const before = readFileSync(file, 'utf8');
    const result = rewriteHtml(before);
    files++;
    if (result.html !== before) {
      writeFileSync(file, result.html);
      changed++;
      replaced += result.replaced;
    }
  }
  console.log(JSON.stringify({ files, changed, productLinksReplaced: replaced, marker: MARKER }));
}
