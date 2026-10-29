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
const hasLeadWord = n => /^(original|genuine|powerful|premium|top|best|quality|reliable|proven|effective|fast-acting|heavy-duty|high-potency|long-lasting)\b/i.test(n);
const hasTrustWord = n => /^(original|genuine)\b/i.test(n);
export const trustName = (name, ctx) => (isGenuine(ctx) && !hasTrustWord(name) ? `Original ${name}` : name);

// Visible H1 on the product page. No length limit here, so it carries BOTH words: "Original" when it is true (known brand or farm input)
// followed by a type-appropriate power word ("Original Powerful Bazooka 18EC Insecticide", "Top-Quality Hand Pressure Sprayer").
// A name that already starts with one of these lead words is left alone, so a word is never repeated.
export function pdpH1(name, ctx = {}) {
  const base = String(name || '').replace(/\s+/g, ' ').trim();
  if (hasLeadWord(base)) return base;
  return [isGenuine(ctx) ? 'Original' : '', powerWord(base, ctx), base].filter(Boolean).join(' ');
}

// One visible line under the H1 on the product page. Same claims as the meta description (genuine only where true).
//   "Best Price in Kenya · 100% genuine & high-potency · M-Pesa checkout · Delivery to all 47 counties"
export function pdpTagline(ctx = {}) {
  const desc = DESCRIPTOR[productType(ctx.catSlug)];
  const claim = isGenuine(ctx) ? `100% genuine & ${desc}` : desc.charAt(0).toUpperCase() + desc.slice(1);
  return `Best Price in Kenya \u00b7 ${claim} \u00b7 M-Pesa checkout \u00b7 Delivery to all 47 counties`;
}

// PDP meta title, max 60 characters.
//   Best:   "<Original|Power word> <name> – Best Price in Kenya | Stermont Arcade"
// "Original" leads when it is true (known brand or farm input); otherwise a type-appropriate power word leads.
// Long names cannot fit all of that in 60 characters, so wording is dropped from the least important end:
// store name, then "Best", then the lead word, then the name itself is shortened. "Price in Kenya" is kept as long as possible.
export function pdpTitle(name, ctx = {}) {
  const base = String(name || '').replace(/\s+/g, ' ').trim();
  const lead = hasLeadWord(base) ? '' : (isGenuine(ctx) ? 'Original' : powerWord(base, ctx));
  const led = lead ? `${lead} ${base}` : base;
  const tiers = [
    `${led} – Best Price in Kenya | ${STORE}`,
    `${led} – Price in Kenya | ${STORE}`,
    `${led} – Best Price in Kenya`,
    `${base} – Best Price in Kenya | ${STORE}`,
    `${led} – Price in Kenya`,
    `${base} – Price in Kenya | ${STORE}`,
    `${base} – Best Price in Kenya`,
    `${base} – Price in Kenya`
  ];
  const hit = tiers.find(t => t.length <= TITLE_MAX);
  return hit || `${clip(base, TITLE_MAX - ' – Price in Kenya'.length)} – Price in Kenya`;
}

// PDP meta description, max 155 characters.
//   "Buy 100% genuine & high-potency <name> in Kenya at Stermont Arcade. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or countrywide delivery."
export function pdpDescription(name, ctx = {}) {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  const desc = DESCRIPTOR[productType(ctx.catSlug)];
  const gen = isGenuine(ctx) ? `100% genuine & ${desc} ` : `${desc} `;
  const tiers = [
    `Buy ${gen}${n} in Kenya at ${STORE}. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or countrywide delivery.`,
    `Buy ${gen}${n} in Kenya at ${STORE}. M-Pesa checkout, Sarit Centre Westlands pickup, delivery to 47 counties.`,
    `Buy ${gen}${n} in Kenya at ${STORE}. M-Pesa checkout, Westlands pickup or delivery to all 47 counties.`,
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
  const tiers = [
    `Shop Top & Reliable ${c} Online in Kenya – M-Pesa & Delivery`,
    `Shop Top & Reliable ${c} Online in Kenya | ${STORE}`,
    `Shop Top ${c} Online in Kenya – M-Pesa & Delivery`,
    `Shop Top ${c} Online in Kenya | ${STORE}`,
    `Shop Top ${c} Online in Kenya`,
    `Buy ${c} Online in Kenya | ${STORE}`,
    `Buy ${c} in Kenya | ${STORE}`,
    `Buy ${c} in Kenya`
  ];
  return tiers.find(t => t.length <= TITLE_MAX) || clip(`Buy ${c} in Kenya`, TITLE_MAX);
}

// Category meta description. "PCPB-approved" only for PCPB-regulated categories.
export function catDescription(catName, catSlug) {
  const c = String(catName || '').replace(/\s+/g, ' ').trim();
  const pcpb = isPcpb(catSlug);
  const tiers = pcpb ? [
    `Order PCPB-approved, top-quality ${c} at wholesale prices in Nairobi. Fast delivery across 47 counties with secure M-Pesa checkout.`,
    `Order PCPB-approved, top-quality ${c} at wholesale prices in Nairobi. Delivery to 47 counties, M-Pesa checkout.`,
    `Order PCPB-approved ${c} at wholesale prices in Nairobi, Kenya. Fast delivery to all 47 counties.`,
    `Order PCPB-approved ${c} in Kenya. M-Pesa checkout, delivery to all 47 counties.`
  ] : [
    `Order top-quality ${c} online in Nairobi, Kenya. Pay by M-Pesa, pick up at Sarit Centre Westlands or get fast delivery to all 47 counties.`,
    `Order top-quality ${c} online in Kenya. Pay by M-Pesa, Westlands pickup or fast delivery to all 47 counties.`,
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
