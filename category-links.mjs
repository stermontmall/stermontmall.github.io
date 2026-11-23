// Resolve links to category pages that were not built because they have no active products.
import { HUBS } from './category-hubs.mjs';

const PARENT_BY_CHILD = new Map();
for (const [parent, hub] of Object.entries(HUBS)) {
  for (const child of hub.kids || []) if (!PARENT_BY_CHILD.has(child)) PARENT_BY_CHILD.set(child, parent);
}

export function resolveCategoryPath(slug, existingSlugs) {
  const existing = existingSlugs instanceof Set ? existingSlugs : new Set(existingSlugs || []);
  let current = String(slug || '').replace(/\.html$/i, '').replace(/^\/c\//, '');
  const seen = new Set();
  while (current && !seen.has(current)) {
    if (existing.has(current)) return `/c/${current}.html`;
    seen.add(current);
    current = PARENT_BY_CHILD.get(current) || '';
  }
  return '/products.html';
}

export function normalizeCategoryLinks(html, existingSlugs) {
  const existing = existingSlugs instanceof Set ? existingSlugs : new Set(existingSlugs || []);
  return String(html || '').replace(
    /(<a\b[^>]*\bhref=)(["'])(https:\/\/stermontarcade\.co\.ke)?\/c\/([a-z0-9-]+)\.html\2([^>]*>)([\s\S]*?)(<\/a>)/gi,
    (match, prefix, quote, host, slug, attrs, inner, close) => {
      const path = resolveCategoryPath(slug, existing);
      if (path === `/c/${slug}.html`) return match;
      const label = path === '/products.html' && !/<[^>]+>/.test(inner)
        ? 'Browse all products'
        : inner;
      const absolute = host ? 'https://stermontarcade.co.ke' : '';
      return prefix + quote + absolute + path + quote + attrs + label + close;
    }
  );
}
