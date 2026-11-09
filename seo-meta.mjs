// Stermont Arcade - shared SEO wording for product and category pages (Kenyan search intent).
// Used by generate-products.mjs and seo-kenya.mjs so the title/description pattern lives in ONE place.
// Pure functions, no network, no file access.
//
// Truthful-claims rule: a claim is only added where it is true for that product.
//   "Original" / "genuine"  -> only for known brands and for registered pest control / agrochemical / vet / farm-input products.
//   "PCPB approved"         -> only for categories the Pest Control Products Board regulates (pesticides, herbicides, fungicides, adjuvants).
//   Delivery                -> Nairobi same or next day, 1 to 3 days to the other counties (see shipping.html). Never "same-day to 47 counties".
//   Power words             -> descriptive, product-type appropriate adjectives only (see POWER). Never "#1 Rated", "Top-Rated",
//                              "Guaranteed" or "Certified": those are verifiable claims and need real ratings / paperwork behind them.
//   EXCEPTION (owner decision, 2026-10-29): names the owner supplied in the Master Catalog SEO Mapping PDF (stored in products.seo_name /
//   products.seo_title, applied by seo-titles.mjs) may carry such words. This file never ADDS them; hasLeadWord below only recognises them
//   so that no second word is ever stacked in front of the owner's wording.

export const STORE = 'Stermont Arcade';
export const TITLE_MAX = 60;   // product titles
export const DESC_MAX = 155;   // meta descriptions

// Categories regulated by the Pest Control Products Board (PCPB). Only these may be described as PCPB approved/registered.
export const PCPB_CATS = new Set(['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals',
  'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators']);
// Pest control products for homes and premises (dudu / kunguni / mchwa wording fits here).
export const PEST_CATS = new Set(['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals']);
// Farm inputs where "original / genuine" is a real buying concern (counterfeit chemicals).
export const FARM_CATS = new Set([...PCPB_CATS, 'agrovet', 'fertilizers', 'veterinary-drugs', 'animal-feeds', 'disinfectants-hygiene', 'seeds-seedlings']);

const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:(–-]+\S*$/, '').replace(/[\s,;:(–-]+$/, '') + '…' : s; };

// "Original <name>" only when it is true: a known brand (anything other than the store name) or a farm input.
export const isGenuine = ({ brand, catSlug }) => (!!brand && brand !== STORE) || FARM_CATS.has(catSlug);
export const isPcpb = catSlug => PCPB_CATS.has(catSlug);
export const isPest = catSlug => PEST_CATS.has(catSlug);
const isAgro = catSlug => PCPB_CATS.has(catSlug) && !PEST_CATS.has(catSlug);

// ---------------------------------------------------------------------------------------------
// Power words by product type. Lists are ordered by search value; the pick is deterministic
// (hash of the product name) so a page keeps the same wording on every rebuild, while the catalog
// as a whole gets variety instead of 250 identical titles.
// ---------------------------------------------------------------------------------------------
export const POWER = {
  pest:    ['Powerful', 'Fast-Acting', 'Heavy-Duty', 'High-Potency', 'Long-Lasting'],      // home/premises pest control
  agro:    ['Powerful', 'High-Potency', 'Fast-Acting', 'Proven', 'Effective'],             // crop chemicals
  farm:    ['Top-Quality', 'Reliable', 'Proven', 'Effective'],                             // other farm / vet inputs
  general: ['Top-Quality', 'Reliable', 'Premium']                                          // everything else
};
// Descriptor used inside meta descriptions ("Buy 100% genuine & high-potency <name>").
export const DESCRIPTOR = { pest: 'high-potency', agro: 'high-potency', farm: 'quality', general: 'top-quality' };

export const productType = catSlug => isPest(catSlug) ? 'pest' : isAgro(catSlug) ? 'agro' : FARM_CATS.has(catSlug) ? 'farm' : 'general';

const hash = s => { let h = 0; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

// A power word the name does not already contain (so "Powerful Bazooka Powerful" never happens).
export function powerWord(name, ctx = {}) {
  const list = POWER[productType(ctx.catSlug)];
  const n = String(name || '').toLowerCase();
  const usable = list.filter(w => !n.includes(w.toLowerCase().replace(/-/g, ' ')) && !n.includes(w.toLowerCase()));
  const pool = usable.length ? usable : list;
  return pool[hash(name) % pool.length];
}

// Does the name already start with "Original", "Genuine" or one of our power words? Then do not repeat it.
// The second half of the list is every lead word used in the owner's Master Catalog SEO Mapping PDF (see EXCEPTION at the top), so those names are never prefixed again.
export const hasLeadWord = n => /^(?:#\d+\s+)?(?:original|genuine|powerful|premium|top|best|quality|reliable|proven|effective|fast-acting|heavy-duty|high-potency|long-lasting|highly effective|high-yield|professional|commercial-grade|leading|trusted|sturdy|weatherproof|odourless|ultimate|elegant|trendy|value-pack|certified|veterinary standard|rated)\b/i.test(n);
const hasTrustWord = n => /^(original|genuine)\b/i.test(n);
export const trustName = (name, ctx) => (isGenuine(ctx) && !hasTrustWord(name) ? `Original ${name}` : name);

// "Buy" in front of the VISIBLE product name (page H1, shop list, shop product view). Owner request 2026-10-30: "Buy" before every product name.
// Idempotent (a name that already starts with "Buy" is left alone). Deliberately NOT applied to <title>/meta (the 60-character title limit and the owner's exact
// Google titles win), JSON-LD names, breadcrumbs or the Merchant Center feed (Google Shopping rejects promotional words in feed titles).
// Cart, order, e-mail and WhatsApp lines strip it again (checkout-deferred.js info(), storefront-live.js enquiry text), so orders keep the plain product name.
export const buyName = n => { const s = String(n || '').replace(/\s+/g, ' ').trim(); return !s || /^buy\b/i.test(s) ? s : `Buy ${s}`; };

// Visible H1 on the product page. No length limit here, so it carries BOTH words: "Original" when it is true (known brand or farm input)
// followed by a type-appropriate power word ("Buy Original Powerful Bazooka 18EC Insecticide", "Buy Top-Quality Hand Pressure Sprayer").
// A name that already starts with one of these lead words is left alone, so a word is never repeated.
export function pdpH1(name, ctx = {}) {
  const base = String(name || '').replace(/\s+/g, ' ').trim();
  if (hasLeadWord(base)) return buyName(base);
  return buyName([isGenuine(ctx) ? 'Original' : '', powerWord(base, ctx), base].filter(Boolean).join(' '));
}

// One visible line under the H1 on the product page. Only facts that are true for every product (no price or quality superlatives):
//   "M-Pesa checkout · Delivery to all 47 counties · Pickup at Sarit Centre, Westlands"
export function pdpTagline(ctx = {}) {
  return 'M-Pesa checkout · Delivery to all 47 counties · Pickup at Sarit Centre, Westlands';
}

// PDP meta title, max 60 characters. seo-catalog-guard.mjs enforces the same limit on every active database title.
//   Best:   "<Original|Power word> <name> – Best Price in Kenya | Stermont Arcade"
// "Original" leads when it is true (known brand or farm input); otherwise a type-appropriate power word leads.
// Long names cannot fit all of that in 60 characters, so wording is dropped from the least important end:
// store name, then "Best", then the name itself is shortened. The lead word is always kept, and so is "Price in Kenya".
// (Products with an owner-supplied products.seo_title get that exact title afterwards from seo-titles.mjs.)
export function pdpTitle(name, ctx = {}) {
  const base = String(name || '').replace(/\s+/g, ' ').trim();
  const lead = hasLeadWord(base) ? '' : (isGenuine(ctx) ? 'Original' : powerWord(base, ctx));
  const led = lead ? `${lead} ${base}` : base;
  // Ordinary retail products: keep the high-intent phrase "Price in Kenya"; add "Online" when the full name fits.
  // No "Buy" in the title: owner rule 2026-10-30 (the visible H1 carries "Buy"; see buy-name.test.mjs).
  if (productType(ctx.catSlug) === 'general') {
    const tiers = [
      `${led} Online – Price in Kenya`,
      `${led} – Price in Kenya`
    ];
    const hit = tiers.find(t => t.length <= TITLE_MAX);
    return hit || `${clip(led, TITLE_MAX - ' – Price in Kenya'.length)} – Price in Kenya`;
  }
  const tiers = [
    `${led} – Best Price in Kenya | ${STORE}`,
    `${led} – Price in Kenya | ${STORE}`,
    `${led} – Best Price in Kenya`,
    `${led} – Price in Kenya`
  ];
  const hit = tiers.find(t => t.length <= TITLE_MAX);
  // Name too long even without the store name: keep the lead word and clip the product name.
  return hit || `${clip(led, TITLE_MAX - ' – Price in Kenya'.length)} – Price in Kenya`;
}

// PDP meta description, max 155 characters.
//   "Buy 100% genuine & high-potency <name> in Kenya at Stermont Arcade. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or countrywide delivery."
export function pdpDescription(name, ctx = {}, productDescription = '') {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  // Prefer one factual, product-specific sentence from the catalogue over repeating the same generic snippet on every PDP.
  // Strip markup before extracting; the original description remains visible on the page and in Product JSON-LD.
  const source = String(productDescription || '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/[•▪●]/g, ' ').replace(/\s+/g, ' ').trim();
  // Skip catalogue sentences that start with "Buy": the description already opens with "Buy <name> in Kenya: ", so using one
  // produced "Buy X in Kenya: Buy X…" cut off mid-phrase (seen on the NIVEA Sun page). Use the first real product sentence instead.
  const sentences = (source.match(/[^.!?]+[.!?](?=\s|$)/g) || []).map(s => s.trim());
  const fact = sentences.find(s => s.length >= 28 && s.length <= 260 && !/^buy\b/i.test(s)) || '';
  const prefix = `Buy ${n} in Kenya: `;
  const suffix = '. Pay by M-Pesa; delivery to 47 counties.';
  const room = DESC_MAX - prefix.length - suffix.length;
  // Never cut a factual sentence in the middle. A clipped fragment can produce broken snippets
  // (for example, ending a storage specification with an ellipsis). Use the Kenya-specific fallback
  // unless the complete first product sentence fits within the meta-description budget.
  if (fact && room >= 24 && fact.length <= room) {
    const candidate = prefix + fact + suffix;
    if (candidate.length <= DESC_MAX) return candidate;
  }

  // Short/empty catalogue descriptions fall back to the established Kenya-specific wording.
  const desc = DESCRIPTOR[productType(ctx.catSlug)];
  const gen = isGenuine(ctx) ? `100% genuine & ${desc} ` : `${desc} `;
  const tiers = [
    `Buy ${gen}${n} in Kenya at ${STORE}. M-Pesa checkout, Westlands pickup or delivery to all 47 counties.`,
    `Buy ${gen}${n} in Kenya at ${STORE}. M-Pesa checkout, Sarit Centre Westlands pickup, delivery to 47 counties.`,
    `Buy ${gen}${n} in Kenya at ${STORE}. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or countrywide delivery.`,
    `Buy ${isGenuine(ctx) ? '100% genuine ' : ''}${n} in Kenya at ${STORE}. M-Pesa checkout, Westlands pickup or delivery to all 47 counties.`,
    `Buy ${n} in Kenya at ${STORE}. M-Pesa checkout, Westlands pickup or delivery to all 47 counties.`,
    `Buy ${n} in Kenya. M-Pesa checkout, Westlands pickup, delivery to 47 counties.`
  ];
  const hit = tiers.find(t => t.length <= DESC_MAX);
  return hit || clip(`Buy ${n} in Kenya. M-Pesa checkout, pickup or delivery to 47 counties.`, DESC_MAX);
}

// Category meta title.
//   "Shop Top & Reliable <Category> Online in Kenya – M-Pesa & Delivery"
export function catTitle(catName) {
  const c = String(catName || '').replace(/\s+/g, ' ').trim();
  if (c.toLowerCase() === 'cars for sale') return 'New Cars for Sale in Kenya | Stermont Arcade';
  const tiers = [
    `Shop ${c} Online in Kenya | ${STORE}`,
    `Buy ${c} Online in Kenya | ${STORE}`,
    `Shop ${c} in Kenya | ${STORE}`,
    `Buy ${c} in Kenya | ${STORE}`,
    `Shop ${c} in Kenya`,
    `Buy ${c} in Kenya`
  ];
  return tiers.find(t => t.length <= TITLE_MAX) || clip(`Shop ${c} in Kenya`, TITLE_MAX);
}

// Category meta description. "PCPB-approved" only for PCPB-regulated categories.
export function catDescription(catName, catSlug) {
  const c = String(catName || '').replace(/\s+/g, ' ').trim();
  if (catSlug === 'cars-for-sale') return 'Explore brand-new car sourcing adverts in Kenya. Compare indicative competitor prices and representative photos; confirm supplier availability and final quotes before payment.';
  const registrationNote = ['crop-insecticides', 'bed-bug-killers', 'adjuvants-growth-regulators'].includes(catSlug)
    ? ' Check each product label and PCPB registration.'
    : '';
  const base = `Browse ${c} online in Kenya. Compare listed product details and current prices.${registrationNote} Pay by M-Pesa; delivery to all 47 counties.`;
  return base.length <= DESC_MAX ? base : clip(base, DESC_MAX);
}

// Visible trust badges (pills) shown under the price on the product page. Same truthful-claims rule as everything above:
//   "100% Original & PCPB Approved" only in PCPB-regulated categories, "100% Original" only where isGenuine, nothing otherwise.
//   "Top-Quality Selection" replaces "Top-Rated Quality" (we have no ratings to back "Top-Rated"; see the rule at the top).
export function pdpBadges(ctx = {}) {
  const first = isPcpb(ctx.catSlug) ? '100% Original & PCPB Approved' : isGenuine(ctx) ? '100% Original' : null;
  return [first, 'Top-Quality Selection', 'Fast M-Pesa Checkout', 'Sarit Centre Pickup | Delivery to 47 Counties'].filter(Boolean).map(t => `✓ ${t}`);
}

// Product page H2 headings. `features` only for pesticides and crop chemicals (null otherwise), the other two are on every product.
// `delivery` is the heading of the separate delivery box that generate-products.mjs still renders. Before it existed that box printed an EMPTY <h2> on every product page.
export function pdpHeadings(catSlug) {
  const features = isPest(catSlug) ? 'Powerful Features & Target Dudu Control'
    : PCPB_CATS.has(catSlug) ? 'Powerful Features & Target Crop Protection'
    : null;
  return { features, guide: 'Reliable Quality & Application Guide', price: 'Price, M-Pesa Checkout & Kenya Delivery', delivery: 'Delivery to Nairobi & All 47 Counties' };
}


// Variant URLs must identify the selected pack size. The mobile shell reads the
// variant slug from the fragment and opens that exact size on the canonical page.
// Keep this helper shared so JSON-LD offers and customer enquiry links stay in sync.
export function pdpVariantUrl(path, variantSlug, baseSlug, site = 'https://stermontarcade.co.ke') {
  const slug = String(variantSlug || '').trim();
  const base = String(baseSlug || '').trim();
  const root = String(site);
  return (root.endsWith('/') ? root.slice(0, -1) : root) + String(path || '') +
    (slug && slug !== base ? '#' + encodeURIComponent(slug) : '');
}
