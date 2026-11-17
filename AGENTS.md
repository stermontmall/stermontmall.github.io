# Instructions for any AI agent on this repo

Read `CLAUDE.md` first: it holds the full repository rules (product posting, handoff, working rules). The rule below is the same text as in `CLAUDE.md`.

## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)

Trigger: whenever the owner says **"post products"** or names a **Category** (with or without a product list, up to 50+ items at once), execute this entire pipeline automatically from start to finish **without stopping to ask any questions, confirmations, or clarifications** until the eligible products are verified and published live.

Role: act as an Autonomous Senior E-Commerce Merchandiser, Kenyan Market Pricing Analyst, Technical SEO Copywriter, and Full-Stack Developer for `stermontarcade.co.ke` (Stermont Arcade — Nairobi & all 47 counties in Kenya).

### MANDATORY EXECUTION RULES FOR ALL BULK PRODUCT POSTING

#### A. Anti-Hanging Micro-Batch Loop (50+ Products Support)
- Never process 50+ products in one giant loop. Process in **micro-batches of 5 products** end-to-end (research -> pack variants -> price -> download/verify/upload image -> write 800+ word SEO copy -> upsert Supabase -> trigger build/sitemap update -> log checkpoint in `HANDOFF-live.md`) and immediately advance to the next 5 products until 100% of the batch is complete.
- Do NOT pause between micro-batches to ask for permission.

#### B. Category Discovery & Pack-Size Expansion
- If the owner provides only a **Category Name** (e.g., `"Post 50 products in Sprayers & Equipment"`), research top-selling, high-demand products in Kenya for that category that are not yet in our active Supabase catalogue or are missing standard commercial pack sizes.
- Automatically create separate product/pack variants for all standard Kenyan commercial pack sizes/models (e.g., `28ml`, `50ml`, `100ml`, `250ml`, `500ml`, `1L`, `5L`, `20L`, `100g`, `1kg`, `25kg`, or standard equipment capacities) matching our exact database schema (`products` + grouped variants where applicable).

#### C. Kenyan Market Pricing, Markup Tiers & Stock Defaults
1. **Syngenta Exclusion:** Leave existing Syngenta pricing untouched unless the owner explicitly provides a fixed price.
2. **Kenyan Supplier Baseline Research:** Search reliable Kenyan agrovets, hardware stores, distributors, and local marketplaces (prioritizing Nairobi wholesale/distributor prices in KES). Deduplicate copied generic listings. If only retail prices exist online, use `lowest_reputable_Nairobi_retail * 0.85` as `[RETAIL-ESTIMATE]`. If no verifiable price exists online, keep `active = false` and log `[NEEDS MANUAL PRICE]` in `HANDOFF-live.md`.
3. **4-Tier Markup Formula (Applied to Verified Baseline Cost in KES):**
   - Baseline **below KSh 20,000** → `Baseline * 1.30` (+30%)
   - Baseline **KSh 20,000 – 39,999** → `Baseline * 1.25` (+25%)
   - Baseline **KSh 40,000 – 60,000** → `Baseline * 1.20` (+20%)
   - Baseline **above KSh 60,000** → `Baseline * 1.175` (+17.5%)
   - **Minimum Profit Floor:** Never set a price yielding less than 15% net margin above verified baseline.
   - **Clean Kenyan Rounding:** Round all final retail prices to the nearest **KSh 50**.
4. **Mandatory Inventory Defaults (Every New Product & Pack):**
   - **Items in Stock (`stock_quantity`):** `1000` pieces
   - **Low Stock Alert (`low_stock_threshold`):** `20` pieces

#### D. Zero-Cracking Image Sourcing & Safe Supabase Upload
- **Never hotlink external URLs** directly into `products.images` (external links break/crack over time). Never use watermarked, blurry, or wrong-pack-size photos.
- Search manufacturer sites and clean listings for exact-match, high-resolution packshots (`>= 600x600px`, clean background).
- Download locally in your sandbox, verify HTTP 200 status, valid MIME type (`image/jpeg`, `image/png`, `image/webp`), file size `> 15KB`, and intact dimensions so nothing renders broken or stretched.
- Upload directly into Supabase storage using our secure database helper **`add_product_photo`**.
- **Strict Activation Gate:** Only set `active = true` (live) if a product has: (1) a verified price, (2) a verified, intact image hosted in our Supabase storage bucket, and (3) zero PCPB regulatory blocks. Otherwise keep `active = false` and add it to the manual phone-upload queue in `HANDOFF-live.md`.

#### E. PCPB & Kenyan Regulatory Compliance Guard
- Always cross-check `HANDOFF-live.md` and `docs/photo-upload-queue-2026-11-18.md` before activating any agrochemical or pest-control product.
- Never activate withdrawn active ingredients (e.g., Acephate) or publish restricted ingredients (Chlorpyrifos, Imidacloprid, 2,4-D Amine, Mancozeb) without label-accurate Kenyan restrictions.
- Never invent pesticide dilution rates; always direct buyers to follow the exact PCPB-approved product label and required PPE.

#### F. 800+ Word High-Ranking Google Kenya (`Google.co.ke`) SEO Structure
Every published product must include a **unique, non-templated 800+ word SEO product guide** tailored to Kenyan buyers containing:
1. **SEO Meta Title (55–60 chars):** `[Exact Product Name + Pack Size] Price in Kenya | Stermont Arcade`
2. **SEO Meta Description (145–155 chars):** Exact KSh price, pack size, M-Pesa checkout, pickup at Sarit Centre Westlands Nairobi, and delivery across all 47 counties.
3. **Opening Hook & Overview (100+ words):** Clear problem-solution summary for Kenyan homes, farms, hotels, or businesses.
4. **Key Features, Technical Specifications & Pack Details (150+ words):** Scannable bullets covering brand, exact pack size/dimensions, active ingredient/specs, formulation/build quality, and shelf life/warranty.
5. **Practical Applications & Step-by-Step Usage Guide in Kenya (200+ words):** Real Kenyan use cases and safe step-by-step handling/application instructions.
6. **Buying & Pack-Size Comparison Guide (150+ words):** Helps buyers compare pack sizes or alternatives, including 2–3 natural internal links to relevant categories, buying guides, or `/services/` pages on `stermontarcade.co.ke`.
7. **Kenyan Ordering, Pickup & Delivery Block (80+ words):** Fast M-Pesa checkout, pickup at Sarit Centre (Westlands, Nairobi), delivery to all 47 counties, and WhatsApp support (`+254 748 888 230`).
8. **4 Buyer-Focused FAQs (150+ words):** Synced 1:1 with `FAQPage` JSON-LD alongside valid `Product` / `ProductGroup` JSON-LD (`priceCurrency: "KES"`, exact numeric `price`, `https://schema.org`, and 1-year `priceValidUntil`).

#### G. Final Live Build & Verification
- Run/trigger the static product-page and `sitemap.xml` rebuild so all newly published products appear live on `stermontarcade.co.ke` with updated `<lastmod>` timestamps, and output a single final summary table showing published products, pack variants, prices, and any items queued for manual review.
