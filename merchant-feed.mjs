// Google Merchant Center feed helpers for Kenya (used by generate-products.mjs; tested by merchant-feed.test.mjs).
// Kept separate from the generator so each rule can be tested without the live catalogue.
import { readFileSync } from 'node:fs';
import { productIdentifiers } from './seo-product-identifiers.mjs';

const readJson = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
export const CATEGORY_MAP = readJson('./google-product-categories.json');
export const FEED_CONFIG = readJson('./merchant-feed.config.json');

const escXml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Categories that must not be sent to Merchant Center (see merchant-feed.config.json "exclude_categories").
export function feedExcluded(categorySlug, config = FEED_CONFIG) {
  return (config.exclude_categories || []).includes(categorySlug);
}

// google_product_category as the numeric ID from Google's official taxonomy; empty when the category is not mapped.
export function feedCategoryXml(categorySlug, map = CATEGORY_MAP) {
  const hit = map[categorySlug];
  return hit && Number.isInteger(hit.id) ? `<g:google_product_category>${hit.id}</g:google_product_category>` : '';
}

// Use real identifiers when the catalogue has them (validated GTIN, supplied MPN); fall back to identifier_exists=no only when neither exists.
export function feedIdentifierXml(product) {
  const ids = productIdentifiers(product);
  const gtinKey = Object.keys(ids).find(k => k.startsWith('gtin'));
  const parts = [];
  if (gtinKey) parts.push(`<g:gtin>${escXml(ids[gtinKey])}</g:gtin>`);
  if (ids.mpn) parts.push(`<g:mpn>${escXml(ids.mpn)}</g:mpn>`);
  return parts.length ? parts.join('') : '<g:identifier_exists>no</g:identifier_exists>';
}

// Kenya delivery. The delivery fee depends on location and item size, so a price is never invented here:
// g:shipping is emitted only once "shipping.price_kes" is set in merchant-feed.config.json. Until then the
// Merchant Center account-level shipping service for Kenya must supply the shipping cost.
export function feedShippingXml(config = FEED_CONFIG) {
  const s = config.shipping || {};
  const price = Number(s.price_kes);
  if (s.price_kes == null || !Number.isFinite(price) || price < 0) return '';
  const time = (tag, v) => Number.isInteger(v) && v >= 0 ? `<g:${tag}>${v}</g:${tag}>` : '';
  return `<g:shipping><g:country>${escXml(s.country || 'KE')}</g:country><g:service>${escXml(s.service || 'Standard delivery')}</g:service><g:price>${Math.round(price)} KES</g:price></g:shipping>`
    + time('min_handling_time', s.min_handling_time) + time('max_handling_time', s.max_handling_time)
    + time('min_transit_time', s.min_transit_time) + time('max_transit_time', s.max_transit_time);
}
