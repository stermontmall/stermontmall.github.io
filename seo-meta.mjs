// Stermont Arcade - shared SEO wording for product and category pages (Kenyan search intent).
// Used by generate-products.mjs and seo-kenya.mjs so the title/description pattern lives in ONE place.
// Pure functions, no network, no file access.
//
// Truthful-claims rule: a claim is only added where it is true for that product.
//   "Original" / "genuine"  -> only for known brands and for registered pest control / agrochemical / vet / farm-input products.
//   "PCPB approved"         -> only for categories the Pest Control Products Board regulates (pesticides, herbicides, fungicides, adjuvants).
//   Delivery                -> Nairobi same or next day, 1 to 3 days to the other counties (see shipping.html). Never "same-day to 47 counties".

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

// Does the name already start with "Original" or "Genuine"? Then do not repeat it.
const hasTrustWord = n => /^(original|genuine)\b/i.test(n);
export const trustName = (name, ctx) => (isGenuine(ctx) && !hasTrustWord(name) ? `Original ${name}` : name);

// PDP meta title, max 60 characters.
//   Best:   "Original <name> – Price in Kenya | Stermont Arcade"
// Long names cannot fit all of that in 60 characters, so wording is dropped from the least important end:
// first "Original", then the store name, then the name itself is shortened. "Price in Kenya" is kept as long as possible.
export function pdpTitle(name, ctx = {}) {
  const base = String(name || '').replace(/\s+/g, ' ').trim();
  const withTrust = trustName(base, ctx);
  const tiers = [
    `${withTrust} – Price in Kenya | ${STORE}`,
    `${base} – Price in Kenya | ${STORE}`,
    `${withTrust} – Price in Kenya`,
    `${base} – Price in Kenya`
  ];
  const hit = tiers.find(t => t.length <= TITLE_MAX);
  return hit || `${clip(base, TITLE_MAX - ' – Price in Kenya'.length)} – Price in Kenya`;
}

// PDP meta description, max 155 characters.
//   "Buy 100% genuine <name> in Kenya at Stermont Arcade. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or delivery across 47 counties."
export function pdpDescription(name, ctx = {}) {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  const gen = isGenuine(ctx) ? '100% genuine ' : '';
  const tiers = [
    `Buy ${gen}${n} in Kenya at ${STORE}. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or same-day Nairobi delivery and delivery to 47 counties.`,
    `Buy ${gen}${n} in Kenya at ${STORE}. M-Pesa checkout, Sarit Centre Westlands pickup, same-day Nairobi delivery, 47 counties.`,
    `Buy ${gen}${n} in Kenya at ${STORE}. M-Pesa checkout, Westlands pickup or delivery to all 47 counties.`,
    `Buy ${n} in Kenya at ${STORE}. M-Pesa checkout, Westlands pickup or delivery to all 47 counties.`,
    `Buy ${n} in Kenya. M-Pesa checkout, Westlands pickup, delivery to 47 counties.`
  ];
  const hit = tiers.find(t => t.length <= DESC_MAX);
  return hit || clip(`Buy ${n} in Kenya. M-Pesa checkout, pickup or delivery to 47 counties.`, DESC_MAX);
}

// Category meta title.
export function catTitle(catName) {
  const c = String(catName || '').replace(/\s+/g, ' ').trim();
  const tiers = [
    `Buy ${c} Online in Kenya – M-Pesa & Delivery | ${STORE}`,
    `Buy ${c} Online in Kenya | ${STORE}`,
    `Buy ${c} in Kenya | ${STORE}`,
    `Buy ${c} Online in Kenya`,
    `Buy ${c} in Kenya`
  ];
  return tiers.find(t => t.length <= TITLE_MAX) || clip(`Buy ${c} in Kenya`, TITLE_MAX);
}

// Category meta description. "PCPB-approved" only for PCPB-regulated categories.
export function catDescription(catName, catSlug) {
  const c = String(catName || '').replace(/\s+/g, ' ').trim();
  const pcpb = isPcpb(catSlug);
  const tiers = pcpb ? [
    `Order PCPB-approved ${c}, pesticides & agrovet supplies at wholesale prices in Nairobi, Kenya. Fast delivery to all 47 counties.`,
    `Order PCPB-approved ${c} at wholesale prices in Nairobi, Kenya. Fast delivery to all 47 counties.`,
    `Order PCPB-approved ${c} in Kenya. M-Pesa checkout, delivery to all 47 counties.`
  ] : [
    `Order ${c} online in Nairobi, Kenya at great prices. Pay by M-Pesa, pick up at Sarit Centre Westlands or get fast delivery to all 47 counties.`,
    `Order ${c} online in Kenya. Pay by M-Pesa, Westlands pickup or fast delivery to all 47 counties.`,
    `Order ${c} in Kenya. M-Pesa checkout, delivery to all 47 counties.`
  ];
  return tiers.find(t => t.length <= DESC_MAX) || clip(`Order ${c} in Kenya. M-Pesa checkout, delivery to 47 counties.`, DESC_MAX);
}

// Product page H2 headings (local utility + problem solving). The first one depends on what the product is.
export function pdpHeadings(catSlug) {
  const first = isPest(catSlug) ? 'Target Pests & Dudu Control Application'
    : PCPB_CATS.has(catSlug) ? 'Target Crops, Pests & Application'
    : FARM_CATS.has(catSlug) ? 'Uses & Application'
    : null;
  return { uses: first, price: 'Price & M-Pesa Ordering in Kenya', delivery: 'Delivery to Nairobi & 47 Counties' };
}
