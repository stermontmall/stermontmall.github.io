# Instructions for any Claude session on this repo

## Product posting — mandatory
If the owner asks to add/post/list an advert or product, or attach product photos:
1. Read `PUBLISHING.md` FIRST and follow it.
2. Use the project slash command `/post-product` as the task checklist (defined in `.claude/commands/post-product.md`).
3. PHOTOS ARE MANDATORY FOR PUBLICATION. Prefer sending the exact public HTTPS supplier/product-page URL to the deployed Supabase `upload-photos` function as `{product_id, image_url}`; deployed v14 automatically extracts up to four candidates (Open Graph, Twitter image, `image_src`, image metadata and Product JSON-LD). If extraction fails, use a direct HTTPS image URL; if blocked, send exact image bytes as `image_base64` or multipart `files`. It stores the file in `product-images` and updates `products.images`. The function validates image bytes, not product identity, so the exact product and pack size must be confirmed from the source page. Owner rule (2026-11-18): use the automated image verification and activation rule in the canonical publishing section below. Human visual inspection is not required; exact Kenyan supplier/manufacturer product-page title/URL and pack-size match, technical image checks, successful `add_product_photo` storage, and a matching `products.images` reference are mandatory before auto-activation. NEVER publish a product with no verified image. If no exact-match image is found or verification fails, leave it inactive (single product) or skip the candidate (bulk posting); never substitute a generic or mismatched image.
4. Never invent a photo URL. Only report a photo as attached after checking the Storage object and the `products.images` reference.
5. Pricing, stock defaults, SEO copy and publishing for new products follow `## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)` below (4-tier markup rounded to nearest KSh 50, KSh 200 minimum price, stock=1000, low-stock alert=20, unique 800+ word SEO descriptions, publish live with `active=true` as soon as price and image are verified, no owner-approval wait). Find the source price online yourself from the Kenyan source directory in that rule. Never invent a price: with no verifiable KES price, skip the candidate (bulk) or keep it inactive and log `[NEEDS MANUAL PRICE]`.
6. PRODUCT LINK (owner rule 2026-11-08, permanent): EVERY human-facing product link (WhatsApp prefill/message, share/copy button, storefront card, product recommendation, admin/order/email/receipt, blog/guide CTA, and any link given to a customer or staff member) MUST be generated with the shared `shellProductLink(slug)` helper and open `https://stermontarcade.co.ke/?product=<products.slug>`. NEVER emit `/p/<slug>.html` or `/classic.html` as a human-facing product link. The `/p/<slug>.html` documents remain live and indexable for Google; preserve canonical, `og:url`, sitemap, Product/ItemList JSON-LD, breadcrumbs and `seo-links` crawl links exactly. Do NOT add redirects, JS redirects or user-agent switching on `/p/` pages. `no-static-share-links.test.mjs` enforces this rule.

## Handoff and progress saving
1. FIRST read `HANDOFF-live.md` (newest progress, wins over everything), THEN `HANDOFF.md` (long history).
2. AUTO-SAVE RULE (owner): after every step (commit, merge, finding, blocker) update `HANDOFF-live.md` straight away: Done / In progress / Next / Blocked, with links and exact commands. The owner may hit a usage limit at any moment and continue on another Claude account; an unsaved step is lost.
   - Save when a task starts, when each task finishes, BEFORE any long command (clone, test run, build) with the exact command to re-run, and whenever blocked.
   - Commit and push `HANDOFF-live.md` with each step (on the `wip-` branch, or on `main` for note-only commits). Add one line to `HANDOFF.md` only when a branch is finished or merged.
   - Each entry: date and time (Africa/Nairobi), what changed, branch and commit, exact next command.
3. Working rules: small steps on a `wip-<task>` branch, push after each, merge to `main` only when finished AND tested. Never edit generated pages (`p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`); edit the generators. Bump `?v=` in `index.html` for every change to `mobile-shell/app.js` or `tailwind.css`. Back up old product text in `description_backup` before writing to Supabase. Do not touch product titles unless explicitly asked.
4. If the sandbox has no network or clone, say which tests could not be run and put the exact command in `HANDOFF-live.md`.
5. To rebuild product pages NEVER edit or rewrite `.github/workflows/product-pages.yml` (on 2026-11-08 a commit replaced it with comments only and no page was rebuilt for two hours). Trigger it with `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`. `workflow-guard.yml` fails the push if any workflow file is empty or invalid. Owner-approved exception (2026-11-16): the commit step and the conflict-resolution `case` list in that workflow include `robots.txt`, so the generated `robots.txt` is committed with the other generated files. Keep that addition when touching the workflow; do not remove it.
6. Never link to `/classic.html`; the checkout is `/checkout.html` (opened only inside the shell). `no-classic-hop.test.mjs` enforces this.


## Product data notes (pricing and word-count rules moved to the bulk publishing rule below)
- Pricing, stock defaults and description length are set by `## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)` below; the older 2026-11-14 `cost * 1.30` and 600–900 word rules were replaced by it. featured=false for new products.
- The database helper accepts 40–2,000 words per description.
- SEO metadata columns now exist (owner-approved 2026-11-16, migration `20261115172817 seo_metadata_foundation`): see "Approved SEO metadata columns" below. Do not add further columns or make other schema changes for a product batch. (Exception, owner-approved 2026-11-18: migration `publishing_rules_rulebook_and_stock_defaults` added the `public.publishing_rules` table mirroring the rulebook below, and confirmed defaults `products.stock = 1000` and `products.low_at = 20`.)

## Approved SEO metadata columns (owner approval 2026-11-16, PR #784)
- Migration `20261115172817 seo_metadata_foundation` (source `supabase/sql/seo_metadata_foundation.sql`) is applied and recorded; do not re-run it.
- `public.products`: `meta_title`, `meta_description`, `alt_text`, `keywords text[]`, and generated `stock_status` (`in_stock` / `out_of_stock` from `stock`). `public.categories`: `description`, `meta_title`, `meta_description`, `keywords`. Unique slug indexes `products_slug_unique_seo_idx` and `categories_slug_unique_seo_idx`.
- `meta_title` was initialised from `seo_title` (still the approved title source); `meta_description` was initialised from the first 155 characters of `description`, then trimmed on 2026-11-16 (226 rows had leading/trailing whitespace; no line breaks or double spaces). Keep values single-spaced, trimmed and at most 160 characters.
- Categories' `meta_description` is empty until written; the generator falls back to its own text. `keywords` are editorial notes only and are never emitted as a meta keywords tag.
- The SECURITY DEFINER audit (`docs/security/security-definer-audit-2026-11-15.md`) is read-only. Privilege changes (for example `add_draft_product` anon/PUBLIC execution, `is_staff`, search paths) go in a separate Security PR and must not touch checkout, order or M-Pesa functions.

## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)

This is the canonical rule. It replaces all older conflicting product-posting rules. A server-side mirror is stored in Supabase table `public.publishing_rules` (key `autonomous_bulk_product_publishing`); keep the two aligned.

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
