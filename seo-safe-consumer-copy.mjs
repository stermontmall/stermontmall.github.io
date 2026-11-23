// Safe, exact-route consumer copy corrections only.
// This pass replaces cross-product boilerplate on three ordinary consumer pages.
// It never touches unlisted products, categories, blog posts, or shared templates.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';

export const SAFE_CONSUMER_COPY = Object.freeze({
  'classic-mens-black-formal-blazer.html': {
    id: 'classic-men-s-black-formal-blazer-piece',
    canonical: SITE + '/p/classic-mens-black-formal-blazer.html',
    replacements: [
      {
        pattern: /<li>How to Use and What to Check Before using Classic Men&#39;s Black Formal Blazer,[\s\S]*?<\/li>/i,
        replacement: '<li>How to Check Fit and Style: Review the available size and fit information for this blazer. Compare the garment measurements with a jacket you already own, and use the product photos to check the colour and design shown in this listing.</li>'
      },
      {
        pattern: /<li>Before You Order Before completing an order for Classic Men&#39;s Black Formal Blazer,[\s\S]*?<\/li>/i,
        replacement: '<li>Before You Order: Review the selected item, size details and displayed price on this page before checkout. Keep your order confirmation and payment reference until you have received and checked the blazer.</li>'
      },
      {
        pattern: /<li>Frequently Asked Questions[\s\S]*?What should I check before buying Classic Men&#39;s Black Formal Blazer\?[\s\S]*?<\/li>/i,
        replacement: '<li>Frequently Asked Questions\n\nWhat should I check before buying Classic Men&#39;s Black Formal Blazer? Compare the available size and fit information with a blazer you own, and review the product photos for the black colour and design shown in this listing.</li>'
      }
    ],
    trimProductSchemaFaq: false
  },
  'apple-iphone-16-128gb-green.html': {
    id: 'apple-iphone-16-128gb-green',
    canonical: SITE + '/p/apple-iphone-16-128gb-green.html',
    replacements: [
      {
        pattern: /<p>\s*What should I check before buying Apple iPhone 16 128GB, Green\?[\s\S]*?<\/p>/i,
        replacement: '<p>What should I check before buying Apple iPhone 16 128GB, Green? Confirm that Green and 128GB are the variant you want. Review the product details and displayed price on this page before checkout.</p>'
      }
    ],
    trimProductSchemaFaq: true
  },
  'apple-iphone-16-128gb-white.html': {
    id: 'apple-iphone-16-128gb-white',
    canonical: SITE + '/p/apple-iphone-16-128gb-white.html',
    replacements: [
      {
        pattern: /<p>\s*What should I check before buying Apple iPhone 16 128GB, White\?[\s\S]*?<\/p>/i,
        replacement: '<p>What should I check before buying Apple iPhone 16 128GB, White? Confirm that White and 128GB are the variant you want. Review the product details and displayed price on this page before checkout.</p>'
      }
    ],
    trimProductSchemaFaq: true
  }
});

const countMatches = (html, pattern) => {
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  return [...html.matchAll(new RegExp(pattern.source, flags))].length;
};

const canonicalOf = html => {
  const tags = (html.match(/<link\b[^>]*>/gi) || []).filter(tag => /\brel\s*=\s*(['"])canonical\1/i.test(tag));
  if (tags.length !== 1) return null;
  return tags[0].match(/\bhref\s*=\s*(['"])(.*?)\1/i)?.[2] || null;
};

const productSchemaScript = html => {
  const tags = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi)];
  const matches = [];
  for (const match of tags) {
    try {
      const data = JSON.parse(match[1]);
      if (data && data['@type'] === 'Product') matches.push({ full: match[0], data });
    } catch {
      // A malformed or unexpected JSON-LD block is left untouched by this pass.
    }
  }
  return matches;
};

export function applySafeConsumerCopy(html, item) {
  if (!html || !item) return html;
  const id = html.match(/<meta\s+name=["']stm-id["']\s+content=["']([^"']*)["']/i)?.[1];
  if (id !== item.id || canonicalOf(html) !== item.canonical) return html;

  // Require every expected source block before changing anything, so a future
  // template/content change cannot produce a partial or broad replacement.
  if (!item.replacements.every(rule => countMatches(html, rule.pattern) === 1)) return html;

  let next = html;
  for (const rule of item.replacements) next = next.replace(rule.pattern, rule.replacement);

  if (item.trimProductSchemaFaq) {
    const schemas = productSchemaScript(next);
    if (schemas.length !== 1 || typeof schemas[0].data.description !== 'string') return html;
    const marker = ' FREQUENTLY ASKED QUESTIONS';
    const at = schemas[0].data.description.indexOf(marker);
    if (at < 0 || schemas[0].data.description.indexOf(marker, at + marker.length) !== -1) return html;
    schemas[0].data.description = schemas[0].data.description.slice(0, at).trim();
    const replacement = '<script type="application/ld+json">' + JSON.stringify(schemas[0].data) + '</script>';
    next = next.replace(schemas[0].full, replacement);
  }

  return next;
}

export function runSafeConsumerCopy({ dir = 'p' } = {}) {
  let changed = 0, skipped = 0;
  for (const [file, item] of Object.entries(SAFE_CONSUMER_COPY)) {
    const path = dir + '/' + file;
    if (!existsSync(path)) { skipped++; continue; }
    const before = readFileSync(path, 'utf8');
    const after = applySafeConsumerCopy(before, item);
    if (after === before) {
      skipped++;
      console.log('safe-consumer-copy: identity/canonical/source-block guard skipped ' + file);
      continue;
    }
    writeFileSync(path, after);
    changed++;
  }
  console.log('safe-consumer-copy: updated ' + changed + ' allowlisted ordinary-product page(s); skipped ' + skipped + '.');
}

if (process.argv[1] && process.argv[1].endsWith('seo-safe-consumer-copy.mjs')) runSafeConsumerCopy();
