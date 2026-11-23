// Resolve category links against category pages built from products in the current catalogue snapshot.
import { HUBS } from './category-hubs.mjs';

const PARENT_BY_CHILD = new Map();
for (const [parent, hub] of Object.entries(HUBS)) {
  for (const child of hub.kids || []) if (!PARENT_BY_CHILD.has(child)) PARENT_BY_CHILD.set(child, parent);
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Category HTML is generated from the active product snapshot. A page is active only
// when its rendered product list contains at least one available product.
export function activeCategorySlugsFromPages(pages) {
  const active = new Set();
  for (const page of pages || []) {
    const html = String(page.html || '');
    const list = (html.match(/<ul\\b[^>]*\\bid=["']category-products["'][^>]*>([\\s\\S]*?)<\\/ul>/i) || [])[1] || '';
    if (/<li\\b[^>]*\\bdata-price=["'](?:[1-9]\\d*)(?:\\.\\d+)?["']/i.test(list)) {
      active.add(String(page.slug || '').replace(/\\.html$/i, ''));
    }
  }
  return active;
}

export function resolveCategorySlug(slug, activeSlugs) {
  const active = activeSlugs instanceof Set ? activeSlugs : new Set(activeSlugs || []);
  let current = String(slug || '').replace(/\\.html$/i, '').replace(/^\\/c\\//, '');
  const seen = new Set();
  while (current && !seen.has(current)) {
    if (active.has(current)) return current;
    seen.add(current);
    current = PARENT_BY_CHILD.get(current) || '';
  }
  return null;
}

export function resolveCategoryPath(slug, activeSlugs) {
  const resolved = resolveCategorySlug(slug, activeSlugs);
  return resolved ? `/c/${resolved}.html` : null;
}

export function normalizeCategoryLinks(html, activeSlugs) {
  const active = activeSlugs instanceof Set ? activeSlugs : new Set(activeSlugs || []);
  return String(html || '').replace(
    /(<a\\b[^>]*\\bhref=)(["'])(https:\\/\\/stermontarcade\\.co\\.ke)?\\/c\\/([a-z0-9-]+)\\.html\\2([^>]*>)([\\s\\S]*?)(<\\/a>)/gi,
    (match, prefix, quote, host, slug, attrs, inner, close) => {
      const resolved = resolveCategorySlug(slug, active);
      if (!resolved) return inner;
      if (resolved === slug) return match;
      const targetLabel = HUBS[resolved]?.name || resolved.replace(/-/g, ' ').replace(/\\b\\w/g, ch => ch.toUpperCase());
      const absolute = host ? 'https://stermontarcade.co.ke' : '';
      return prefix + quote + absolute + `/c/${resolved}.html` + quote + attrs + esc(targetLabel) + close;
    }
  );
}
