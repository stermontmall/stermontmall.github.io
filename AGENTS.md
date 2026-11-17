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
1. **Syngenta Exclusion:** Skip Syngenta pricing changes unless explicitly instructed.
2. **Baseline Cost (KES):** Lowest reliable Kenyan wholesale/distributor price from the physical-store directory above (or `lowest_reputable_Nairobi_retail * 0.85` when only retail prices are listed online).
3. **4-Tier Markup Formula:**
   - Baseline **below KSh 20,000** → **+30%** (`Baseline * 1.30`)
   - Baseline **KSh 20,000 – 39,999** → **+25%** (`Baseline * 1.25`)
   - Baseline **KSh 40,000 – 60,000** → **+20%** (`Baseline * 1.20`)
   - Baseline **above KSh 60,000** → **+17.5%** (`Baseline * 1.175`)
4. **Mandatory Guardrails:**
   - **Minimum Net Margin Floor:** Never set a price yielding less than **15% net margin** above baseline.
   - **Rounding:** Round final retail prices to the nearest **KSh 50**.
   - **Minimum Storefront Retail Price Floor:** Every product and pack variant must be at least **KSh 200** (if `< 200`, set to `200`).

#### 5. MANDATORY INVENTORY DEFAULTS
- **Stock (`products.stock`):** `1000` pieces on every new product and pack variant.
- **Low-stock alert (`products.low_at`):** `20` pieces on every new product and pack variant.
- (The database defaults for these two columns are set at schema level. The columns are named `stock` and `low_at`; there are no `stock_quantity` / `low_stock_threshold` columns.)

#### 6. ZERO-CRACKING IMAGE UPLOAD (`add_product_photo`)
- Find clean, high-resolution, exact-pack-size product images (no competitor watermarks, no blurry thumbnails).
- Download locally, verify `HTTP 200`, valid image MIME type (`image/jpeg`, `image/png`, `image/webp`), intact dimensions, and `> 15KB` file size so zero images crack or break.
- Never hotlink external URLs—upload directly to Supabase storage via **`add_product_photo`**.

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
