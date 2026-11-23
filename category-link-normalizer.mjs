// Resolve category links to an existing category page that still contains active product links.
// Missing/empty child categories fall back through category-parent-map.json. If no live parent exists,
// the anchor is removed but its visible label is kept as plain text.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PARENTS = JSON.parse(readFileSync(join(ROOT, 'category-parent-map.json'), 'utf8'));
const ACTIVE = new Map();

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
  html = html.replace(/<a\b([^>]*?)\bhref\s*=\s*(["'])(?:https:\/\/stermontarcade\.co\.ke)?\/c\/([^"'?#]+)\.html(?:#[^"']*)?\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (whole, before, quote, slug, after, label) => {
      const target = categoryTarget(slug);
      return target
        ? '<a' + before + 'href=' + quote + '/c/' + target + '.html' + quote + after + '>' + label + '</a>'
        : label;
    });
  return html.replace(/\u0000STM_CATEGORY_SCRIPT_(\d+)\u0000/g, (token, index) => scripts[Number(index)] || token);
}
