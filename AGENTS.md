# Instructions for any AI agent on this repo

Read `CLAUDE.md` first: it holds the full repository rules (product posting, handoff, working rules). The rule below is the same canonical text as in `CLAUDE.md`; it replaces all older conflicting product-posting rules.

## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)

A server-side mirror is stored in Supabase table `public.publishing_rules` (key `autonomous_bulk_product_publishing`); keep the two aligned.

#### 1. ZERO-QUESTION AUTONOMY & PRE-ANSWERED EDGE CASES (NEVER PAUSE TO ASK)
Whenever the user says `"Post [N] items on [Category]"` (for ANY category on `stermontarcade.co.ke`), execute continuously until 100% of the batch is live. Use these pre-answered defaults for every possible edge case so you NEVER ask the user for clarification:
- **Duplicate Check:** Before creating any product, check existing `products` in Supabase by normalized product name, active ingredient/model, and pack size. Skip exact duplicates and move on to the next unique product until you reach the requested count `[N]`.
- **Category Mapping:** Match the requested category to its exact `category_id` in Supabase. If a sub-category doesn't exist yet, assign it to the closest existing parent category on `stermontarcade.co.ke` (never leave `category_id` null).
- **Variant vs. Standalone Page Rule:** If a product has multiple pack sizes or capacities (e.g., `100ml`, `250ml`, `1L`, `5L`, or `32GB`, `64GB`, `128GB`), group them under our existing `ProductGroup` / variant architecture if supported, or create clean individual pack SKUs with distinct pack-size slugs (e.g., `product-name-500ml`) following `main`'s existing generator pattern.
- **Currency & VAT:** All prices are in **Kenyan Shillings (KES / KSh)** inclusive of applicable local taxes. Never use USD, ZAR, or NGN.
- **Missing Price or Image Fallback:** If a candidate product has no verifiable Kenyan price OR no clean, downloadable, non-cracked image after searching our trusted directory, **skip that candidate immediately and pick the next valid Kenyan product** so the final batch still delivers `[N]` live (`active = true`) products with real images and real prices.
- **Git & Deployment Handling:** Commit directly to `main` if permitted, or if branch protection requires a PR, create the branch, run/verify the build, and merge or leave a single ready-to-merge PR link at the very end—never pause mid-batch.

#### 2. CONTINUOUS MICRO-BATCH LOOP (ANTI-HANGING)
- Process the requested `[N]` items in internal **micro-batches of 5 products** end-to-end:
  `Discover unique Kenyan product & packs -> Verify price from trusted Nairobi physical-store websites -> Apply markup & floors -> Download, verify & upload image via add_product_photo -> Write 800+ word SEO guide -> Upsert Supabase (active = true) -> Rebuild pages & sitemap.xml -> Log checkpoint in HANDOFF-live.md`
- Immediately advance to the next 5 products until all `[N]` items are live.

#### 3. DIVERSE TRUSTED NAIROBI & KENYAN PHYSICAL-STORE SOURCE DIRECTORY (ALL CATEGORIES)
Always source baseline prices and specifications from legitimate Kenyan businesses with physical stores in Nairobi/Kenya so we can reliably source any item locally if needed:
- **Pest Control, Agrochemicals, Agrovets, Seeds, Fertilizers & Livestock:** Osho Chemical Industries (Nairobi Industrial Area), Murphy Chemicals E.A. (Nairobi), Amiran Kenya (North Airport Rd, Nairobi), Twiga Chemical Industries (Nairobi), Lachlan Kenya (Nairobi), Ultravetis East Africa (Nairobi), Cooper K-Brands (Nairobi), Farmers Trend Kenya (Nairobi/Thika), Mkulima Young, Agriflora Kenya, Farmbiza Kenya, and established Nairobi agrovet & pest-control distributors (Industrial Area / CBD / Westlands).
- **Hardware, Sprayers, Water Tanks, Irrigation, Tools, Solar & Automotive:** Davis & Shirtliff (Nairobi Industrial Area/Westlands), Randolf Hardware (Nairobi), Buildmart Kenya (Nairobi), Metro Hardware / Chhani's / Karibu Hardware (Nairobi), Epicenter Africa, SunCulture (Nairobi), and AutoXpress Kenya (Nairobi branches).
- **Supermarkets & Everyday Household, Kitchen, Pet, Health & Beauty, Baby & Cleaning:** Carrefour Kenya, Naivas Supermarket, Quickmart Kenya, and Chandarana Foodplus (Nairobi branches).
- **Electronics, TVs, Fridges, Washing Machines, Phones, Computing & Office:** Hotpoint Appliances Kenya (Sarit Centre / Industrial Area), Ramtons Kenya, Opalnet / Luthuli & Moi Avenue authorized distributors, Avechi Kenya (Nairobi CBD), Phoneplace Kenya (Nairobi CBD), Saruk Digital Solutions (Nairobi), and Text Book Centre (Sarit Centre / Nairobi).
- **Security & CCTV:** Hikvision & Dahua authorized Nairobi distributors (CBD / Westlands / Industrial Area).
- **Fashion, Shoes, Watches & Sporting Goods:** Verified Nairobi retail stores and official Kenyan brand outlets (Sarit Centre / Westlands / Nairobi CBD).
- *Log the exact Nairobi physical store name/URL in `HANDOFF-live.md` for every product as our backup sourcing reference.*

#### 4. EXACT PRICING, 4-TIER MARKUP & PROFIT FLOORS
1. **Syngenta Exclusion:** Skip every Syngenta product for new pricing and leave all existing Syngenta prices/costs untouched unless the owner explicitly instructs otherwise.
2. **Baseline Cost Source (KES):** Use the lowest reliable Kenyan wholesale/distributor price from a trusted Nairobi physical-store/distributor in the directory above. If only reputable Nairobi retail prices are listed online and no wholesale/distributor price is available, calculate baseline cost as `lowest_reputable_Nairobi_retail * 0.85`. Record the exact source store and URL.
3. **All Four Markup Tiers (applied to the verified baseline cost in KES):**
   - Baseline **below KSh 20,000**: final pre-rounding price = `Baseline * 1.30` (**+30%**).
   - Baseline **KSh 20,000 through KSh 39,999 inclusive**: final pre-rounding price = `Baseline * 1.25` (**+25%**).
   - Baseline **KSh 40,000 through KSh 60,000 inclusive**: final pre-rounding price = `Baseline * 1.20` (**+20%**).
   - Baseline **above KSh 60,000**: final pre-rounding price = `Baseline * 1.175` (**+17.5%**).
4. **Mandatory Profit Guardrails & Rounding:**
   - **Minimum Net Margin Floor:** The final retail price must never yield less than **15% net margin above the verified baseline cost**. If the tier result would violate this floor, raise the price enough to satisfy the 15% floor before rounding.
   - **Clean Kenyan Rounding:** Round every final retail price to the **nearest KSh 50**.
   - **Minimum Storefront Price Floor:** Every product and every pack variant must have a final retail price of at least **KSh 200**. If the rounded result is below KSh 200, set the final price to **KSh 200**.
   - **Order of operations:** verify baseline in KES -> select exactly one tier using the baseline boundaries above -> apply the tier multiplier -> enforce the 15% minimum margin -> round to nearest KSh 50 -> enforce the KSh 200 minimum storefront price.
#### 5. MANDATORY INVENTORY DEFAULTS
- **Stock (`products.stock`):** `1000` pieces on every new product and pack variant.
- **Low-stock alert (`products.low_at`):** `20` pieces on every new product and pack variant.
- (The database defaults for these two columns are set at schema level. The columns are named `stock` and `low_at`; there are no `stock_quantity` / `low_stock_threshold` columns.)

#### 6. ZERO-CRACKING IMAGE UPLOAD (`add_product_photo`)
- Find clean, high-resolution, exact-pack-size product images (no competitor watermarks, no blurry thumbnails).
- Download locally, verify `HTTP 200`, valid image MIME type (`image/jpeg`, `image/png`, `image/webp`), intact dimensions, and `> 15KB` file size so zero images crack or break.
- Never hotlink external URLs—upload directly to Supabase storage via **`add_product_photo`**.
- **Automated image verification and activation (owner-approved 2026-11-18):** Human visual inspection is NOT required. When the image is fetched from a legitimate Kenyan supplier/manufacturer product page whose page title or URL explicitly matches the exact product name/model and pack size, and the source download passes HTTP 200, allowed image MIME (JPEG/PNG/WebP), dimensions at least 500x500, and file size greater than 15KB, upload it with `add_product_photo`. After the Storage object exists and the exact URL is present in `products.images`, treat the image as verified and immediately set `active=true` once price/SEO and regulatory gates also pass. A successful upload by itself does not waive the exact-source/title/pack match or other gates. Never wait for human visual review. Generic, mismatched, untraceable, or missing images remain inactive.

#### 7. KENYAN REGULATORY & PCPB SAFETY GUARD
- Cross-check `HANDOFF-live.md` and `docs/photo-upload-queue-2026-11-18.md`. Never publish withdrawn active ingredients (e.g., Acephate) or restricted actives (Chlorpyrifos, Imidacloprid, 2,4-D Amine, Mancozeb) without label-accurate Kenyan restrictions, and never invent pesticide dilution rates.

#### 8. 800+ WORD GOOGLE.CO.KE SEO CONTENT & STRUCTURED DATA
Write a **unique, non-templated 800+ word SEO product guide** for every item tailored to Kenyan buyers (`Google.co.ke`) containing:
- **SEO Meta Title (55–60 chars):** `[Exact Product Name + Pack Size] Price in Kenya | Stermont Arcade`
- **SEO Meta Description (145–155 chars):** Exact KSh price, pack size, M-Pesa checkout, pickup at Sarit Centre Westlands Nairobi, and delivery across all 47 counties.
- **Opening Hook & Overview (100+ words)**
- **Key Features, Technical Specs & Pack Details (150+ words)**
- **Practical Applications & Usage Guide in Kenya (200+ words)**
- **Buying & Pack-Size Comparison Guide (150+ words)** with 2–3 natural internal links to relevant categories, guides, or `/services/` pages on `stermontarcade.co.ke`.
- **Kenyan Ordering, Pickup & Delivery Block (80+ words):** M-Pesa checkout, pickup at Sarit Centre (Westlands, Nairobi), delivery to all 47 counties, and WhatsApp `+254 748 888 230`.
- **4 Buyer-Focused FAQs (150+ words)** synced 1:1 with `FAQPage` JSON-LD alongside valid `Product` / `ProductGroup` JSON-LD (`priceCurrency: "KES"`, exact numeric `price`, `https://schema.org`, and 1-year `priceValidUntil`).

#### 9. FINAL LIVE SYNC & SINGLE SUMMARY TABLE
- Set `active = true`, rebuild product pages and `sitemap.xml`, save progress in `HANDOFF-live.md`, and output one concise summary table showing `Product Name | Pack Size | Baseline Cost (KES) | Final Price (KES) | Nairobi Source Store | Live URL`.


### 10. PRODUCT DESCRIPTION FORMATTING — STOREFRONT-NATIVE STRUCTURE
Every product description must be authored in the storefront-native section format consumed by `product-description-html.mjs`; do not store raw HTML. Use explicit section headings on their own lines (or Markdown `##` headings, which the renderer normalizes), short paragraphs of no more than 2–3 sentences, blank-line spacing, and real bullet lists. The renderer outputs semantic `<h3>`, `<p>`, `<ul>`, and `<li>` elements with the site's styled section cards. Never submit one continuous wall of text.

Required buyer-guide sections, in this order where relevant:
1. Product Overview & Key Benefits (concise overview and scannable benefit bullets).
2. Technical Specifications & Pack Details (brand, active ingredient/specifications, exact pack size, formulation/build, target pests/uses, and registration/warranty only when verified).
3. Where & How to Use in Kenya (practical context and label-compliant steps; never invent pesticide rates or authorised uses).
4. Safety, Storage & Handling Guidelines (PPE, storage, first aid and disposal only from authoritative label/regulatory guidance).
5. Buying & Pack-Size Guide (pack comparison and 2–3 natural internal links to relevant category or `/services/` pages).
6. Delivery across Kenya & Nairobi Pickup (M-Pesa checkout, pickup coordination at Sarit Centre Westlands, delivery across all 47 counties, WhatsApp +254 748 888 230; do not imply walk-in availability without confirmation).
7. Frequently Asked Questions (exactly four buyer Q&As for product guides; each question and answer must be separately rendered and synchronised 1:1 with Product FAQPage JSON-LD when FAQ structured data is emitted).

Use only verified product-specific facts. Keep any additional source, pricing, registration, listing-status or disclaimer notes under clearly named subsections. Do not fabricate content or pad word counts: the 800+ word target applies to complete, useful, verified buyer guides, and unresolved facts must be stated as unverified rather than guessed. Preserve exact pack-size identity for every SKU.


### PRODUCT DESCRIPTION SECTION LABELS — CANONICAL STOREFRONT FORMAT

Store each section title as a Markdown `## Heading` on its own line, followed by a blank line. The renderer outputs a styled `<h3>` for each recognised section.

1. Product Overview & Key Benefits
2. Technical Specifications & Pack Details
3. Where & How to Use in Kenya
4. Safety, Storage & Handling Guidelines
5. Buying & Pack-Size Guide
6. Delivery across Kenya & Nairobi Pickup
7. Frequently Asked Questions

Under section 7, include exactly four detailed buyer questions and answers. Product FAQPage JSON-LD must match those four authored pairs 1:1.

Use paragraphs of no more than 2–3 sentences and real bullet lists for verified specifications/checklists. Include 2–3 relevant internal links to category pages, commercial buying guides, or `/services/` pages. Delivery copy may state M-Pesa checkout, coordinated pickup at Sarit Centre Westlands, delivery across all 47 counties subject to stock/courier coverage, and WhatsApp +254 748 888 230.

Maintain 800+ useful words only where supported by verified sources; never pad or invent pesticide dilution rates, approved uses, PPE, label instructions, registration, efficacy, warranty or safety claims. For pesticide products, the current approved Kenyan label takes precedence. Never publish a wall of plain text.
