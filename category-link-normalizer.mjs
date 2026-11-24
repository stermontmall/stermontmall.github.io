// Normalize every category anchor in generated pages to an existing category page
// that still contains active product links. Empty child categories fall back to a
// verified parent; if no live parent exists, keep the label and remove the dead anchor.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PARENTS = JSON.parse(readFileSync(join(ROOT, 'category-parent-map.json'), 'utf8'));
const ACTIVE = new Map();
const ALIASES = new Map([
  ['agrovet-and-farm-supplies', 'agrovet'],
  ['pest-control-and-fumigation', 'pest-control-fumigation']
]);

function hasActiveProducts(slug) {
  if (!/^[a-z0-9-]+$/i.test(String(slug || ''))) return false;
  if (ACTIVE.has(slug)) return ACTIVE.get(slug);
  const file = join(ROOT, 'c', slug + '.html');
  if (!existsSync(file)) { ACTIVE.set(slug, false); return false; }
  const html = readFileSync(file, 'utf8');
  const found = /<a\b[^>]*\bhref\s*=\s*(['"])(?:https:\/\/stermontarcade\.co\.ke)?(?:\/p\/[^'"?#]+\.html(?:#[^'"]*)?|\/?\?product=[^'"]+)\1/i.test(html);
  ACTIVE.set(slug, found);
  return found;
}

export function categoryTarget(slug) {
  let current = String(slug || '').trim().replace(/\.html$/i, '');
  current = ALIASES.get(current) || current;
  const seen = new Set();
  while (current && !seen.has(current)) {
    seen.add(current);
    if (hasActiveProducts(current)) return current;
    current = PARENTS[current] || '';
  }
  return null;
}

export function normalizeCategoryLinks(input) {
  const scripts = [];
  let html = String(input || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, block => {
    const token = '\u0000STM_CATEGORY_SCRIPT_' + scripts.length + '\u0000';
    scripts.push(block);
    return token;
  });
  html = html.replace(/<a\b([^>]*?)\bhref\s*=\s*(["'])(?:https?:\/\/(?:www\.)?stermontarcade\.co\.ke)?\/c\/([^/"'?#]+?)(?:\.html)?(?:#[^"']*)?\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (whole, before, quote, rawSlug, after, label) => {
      const target = categoryTarget(rawSlug);
      return target
        ? '<a' + before + 'href=' + quote + '/c/' + target + '.html' + quote + after + '>' + label + '</a>'
        : label;
    });
  return html.replace(/\u0000STM_CATEGORY_SCRIPT_(\d+)\u0000/g, (token, index) => scripts[Number(index)] || token);
}

function normalizeGeneratedProductPages() {
  const dir = join(ROOT, 'p');
  if (!existsSync(dir)) return;
  let changed = 0;
  for (const file of readdirSync(dir).filter(name => name.endsWith('.html'))) {
    const path = join(dir, file);
    const before = readFileSync(path, 'utf8');
    const after = normalizeCategoryLinks(before);
    if (after !== before) { writeFileSync(path, after); changed++; }
  }
  console.log(`Normalized category links in ${changed} generated product pages.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) normalizeGeneratedProductPages();
