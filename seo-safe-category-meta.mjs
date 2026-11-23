// Safe, explicitly allowlisted ordinary-consumer category metadata only.
// No unlisted category or restricted catalogue route is modified.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const SAFE_CATEGORY_META = Object.freeze({
  'appliances.html': {
    canonical: 'https://stermontarcade.co.ke/c/appliances.html',
    title: 'Home Appliances in Kenya | Stermont Arcade',
    description: 'Browse home appliances in Kenya at Stermont Arcade. Review listed cooking and household appliance details, prices and availability before checkout.'
  },
  'bluetooth-speakers.html': {
    canonical: 'https://stermontarcade.co.ke/c/bluetooth-speakers.html',
    title: 'Bluetooth Speakers in Kenya | Stermont Arcade',
    description: 'Explore Bluetooth speakers in Kenya at Stermont Arcade. Check each listing for connectivity, speaker setup, price and availability before checkout.'
  },
  'computing.html': {
    canonical: 'https://stermontarcade.co.ke/c/computing.html',
    title: 'Computers & Computing in Kenya | Stermont Arcade',
    description: 'Shop computers and computing accessories in Kenya at Stermont Arcade. Compare the listed model, configuration and price before checkout.'
  },
  'fridges-freezers.html': {
    canonical: 'https://stermontarcade.co.ke/c/fridges-freezers.html',
    title: 'Fridges & Freezers in Kenya | Stermont Arcade',
    description: 'Browse fridges and freezers in Kenya at Stermont Arcade. Review listed capacity, layout, features and delivery details before ordering.'
  },
  'fashion.html': {
    canonical: 'https://stermontarcade.co.ke/c/fashion.html',
    title: 'Clothing & Fashion in Kenya | Stermont Arcade',
    description: "Explore clothing and fashion in Kenya at Stermont Arcade. Check each item's style, available size details and price before ordering."
  },
  'home-kitchen.html': {
    canonical: 'https://stermontarcade.co.ke/c/home-kitchen.html',
    title: 'Home & Kitchen in Kenya | Stermont Arcade',
    description: 'Browse home and kitchen products in Kenya at Stermont Arcade. Review available product details, included items and prices before checkout.'
  },
  'kitchen-dining.html': {
    canonical: 'https://stermontarcade.co.ke/c/kitchen-dining.html',
    title: 'Kitchen & Dining in Kenya | Stermont Arcade',
    h1: 'Kitchen & Dining Products in Kenya',
    description: 'Explore kitchen and dining products in Kenya at Stermont Arcade. Browse listed cooking appliances and drinkware; review item details before ordering.'
  }
});

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attrMatch = (tag, attr, value) => new RegExp("\\b" + attr + "\\s*=\\s*(['\"])" + value + "\\1", 'i').test(tag);
const canonicalOf = html => {
  const tags = (html.match(/<link\b[^>]*>/gi) || []).filter(tag => attrMatch(tag, 'rel', 'canonical'));
  if (tags.length !== 1) return null;
  return tags[0].match(/\bhref\s*=\s*(['"])(.*?)\1/i)?.[2] || null;
};
function replaceMeta(html, attr, name, value, required = true) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const matches = tags.filter(tag => attrMatch(tag, attr, name));
  if (!matches.length && !required) return html;
  if (matches.length !== 1 || !/\bcontent\s*=\s*(['"])[\s\S]*?\1/i.test(matches[0])) return null;
  const before = matches[0];
  const after = before.replace(/\bcontent\s*=\s*(['"])[\s\S]*?\1/i, 'content="' + value + '"');
  return html.replace(before, after);
}

export function applySafeCategoryMeta(html, canonical, title, description, h1 = null) {
  if (!html || canonicalOf(html) !== canonical || !title || title.length > 60 || !description || description.length < 70 || description.length > 155) return html;
  const titles = [...html.matchAll(/<title>[\s\S]*?<\/title>/gi)];
  if (titles.length !== 1) return html;
  if (h1 && [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)].length !== 1) return html;
  let next = html.replace(titles[0][0], '<title>' + esc(title) + '</title>');
  for (const [attr, name, value, required] of [
    ['name', 'description', esc(description), true],
    ['property', 'og:description', esc(description), true],
    ['name', 'twitter:description', esc(description), true],
    ['property', 'og:title', esc(title), false],
    ['name', 'twitter:title', esc(title), false]
  ]) {
    next = replaceMeta(next, attr, name, value, required);
    if (next === null) return html;
  }
  if (h1) {
    const tag = (next.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i) || [])[0];
    if (!tag) return html;
    next = next.replace(tag, tag.replace(/>([\s\S]*?)<\/h1>/i, '>' + esc(h1) + '</h1>'));
  }
  return next;
}

export function runSafeCategoryMeta({ dir = 'c' } = {}) {
  let changed = 0, skipped = 0;
  for (const [file, item] of Object.entries(SAFE_CATEGORY_META)) {
    const path = dir + '/' + file;
    if (!existsSync(path)) { skipped++; continue; }
    const before = readFileSync(path, 'utf8');
    const after = applySafeCategoryMeta(before, item.canonical, item.title, item.description, item.h1 || null);
    if (after === before) { skipped++; console.log('safe-category-meta: canonical/tag guard skipped ' + file); continue; }
    writeFileSync(path, after);
    changed++;
  }
  console.log('safe-category-meta: updated ' + changed + ' allowlisted ordinary category page(s); skipped ' + skipped + '.');
}

if (process.argv[1] && process.argv[1].endsWith('seo-safe-category-meta.mjs')) runSafeCategoryMeta();
