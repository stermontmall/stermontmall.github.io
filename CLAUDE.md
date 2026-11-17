# Instructions for any Claude session on this repo

## Product posting — mandatory
If the owner asks to add/post/list an advert or product, or attach product photos:
1. Read `PUBLISHING.md` FIRST and follow it.
2. Use the project slash command `/post-product` as the task checklist (defined in `.claude/commands/post-product.md`).
3. PHOTOS ARE MANDATORY FOR PUBLICATION. Prefer sending the exact public HTTPS supplier/product-page URL to the deployed Supabase `upload-photos` function as `{product_id, image_url}`; deployed v14 automatically extracts up to four candidates (Open Graph, Twitter image, `image_src`, image metadata and Product JSON-LD). If extraction fails, use a direct HTTPS image URL; if blocked, send exact image bytes as `image_base64` or multipart `files`. It stores the file in `product-images` and updates `products.images`. The function validates image bytes, not product identity. Always open and visually inspect the final public Storage URL and confirm exact product/model/pack before activation. NEVER publish a product with no exact, visually verified image. If final visual QA fails or the stored image cannot be opened, leave it inactive and report the blocker; never substitute a generic or mismatched image. (For bulk posting, the owner-approved programmatic image verification in the AUTONOMOUS BULK PRODUCT PUBLISHING RULE below replaces the visual-inspection step; see its Precedence note.)
4. Never invent a photo URL. Only report a photo as attached after checking the Storage object and the `products.images` reference.
5. Owner's new-product rules (updated 2026-11-08): source KES cost + default 30% markup; stock=1000; low-stock alert=20; research the SEO title (max 60 chars) and description yourself; PUBLISH LIVE (`active=true`) as soon as the row and photo are verified, with no owner-approval wait. FIND THE SOURCE PRICE ONLINE YOURSELF: lowest current in-stock KES listing of the exact product (same brand, model, pack size) on a reputable Kenyan seller page, URL recorded. Never invent a price: if no KES listing of the exact product exists, stop and ask. Use 30% by default for every new product; an explicit batch override must be within the helper's accepted 15–300% range.
6. PRODUCT LINK (owner rule 2026-11-08, permanent): the link you give the owner for any product MUST be the mobile shell: `https://stermontarcade.co.ke/?product=<products.slug>`. NEVER give `/p/<id>.html` or `/classic.html` as the link (they open the old/static page). Do not add a visitor redirect on `/p/` pages to achieve this: it was removed on 2026-11-03 over a suspected ranking drop (`HANDOFF-stop-shell-redirect.md`).

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


## Current owner master product prompt (2026-11-14)
> SUPERSEDED for bulk posting: the pricing (`cost * 1.30`) and word-count (600–900 words) lines below are overridden by `## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)` further down (4-tier markup rounded to nearest KSh 50; 800+ word SEO descriptions). The stock/low-stock/featured defaults and the SEO-column notes still apply.
- Use exact source KES cost and `round(cost * 1.30, 2)` selling price; do not apply a second markup or charm-price uplift. Stock=1000, low_at=20, featured=false.
- Product descriptions must be 600–900 original, factual words for this workflow. The database helper accepts 40–2,000 words; skip thin-fact products rather than pad.
- SEO metadata columns now exist (owner-approved 2026-11-16, migration `20261115172817 seo_metadata_foundation`): see "Approved SEO metadata columns" below. Do not add further columns or make other schema changes for a product batch.

## Approved SEO metadata columns (owner approval 2026-11-16, PR #784)
- Migration `20261115172817 seo_metadata_foundation` (source `supabase/sql/seo_metadata_foundation.sql`) is applied and recorded; do not re-run it.
- `public.products`: `meta_title`, `meta_description`, `alt_text`, `keywords text[]`, and generated `stock_status` (`in_stock` / `out_of_stock` from `stock`). `public.categories`: `description`, `meta_title`, `meta_description`, `keywords`. Unique slug indexes `products_slug_unique_seo_idx` and `categories_slug_unique_seo_idx`.
- `meta_title` was initialised from `seo_title` (still the approved title source); `meta_description` was initialised from the first 155 characters of `description`, then trimmed on 2026-11-16 (226 rows had leading/trailing whitespace; no line breaks or double spaces). Keep values single-spaced, trimmed and at most 160 characters.
- Categories' `meta_description` is empty until written; the generator falls back to its own text. `keywords` are editorial notes only and are never emitted as a meta keywords tag.
- The SECURITY DEFINER audit (`docs/security/security-definer-audit-2026-11-15.md`) is read-only. Privilege changes (for example `add_draft_product` anon/PUBLIC execution, `is_staff`, search paths) go in a separate Security PR and must not touch checkout, order or M-Pesa functions.

## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)

**PRECEDENCE (owner, 2026-11-18): this rule overrides the older 2026-11-14 master prompt above.** Where they differ, this rule always wins: the **4-tier markup (rounded to nearest KSh 50)** replaces `cost * 1.30`, and **800+ word SEO descriptions** replace the 600–900 word range. Its programmatic image verification (D2 below) also replaces the visual-inspection step in "Product posting" item 3 for bulk posting.

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
- Search manufacturer sites and clean listings for exact-match, high-resolution packshots (`>= 600x600px` preferred, clean background).
- Upload directly into Supabase storage using our secure database helper **`add_product_photo`**.
- **Strict Activation Gate:** Only set `active = true` (live) if a product has: (1) a verified price, (2) an image that passes the D2 programmatic checks and is hosted in our Supabase storage bucket, and (3) zero PCPB regulatory blocks. Otherwise keep `active = false` and add it to the manual phone-upload queue in `HANDOFF-live.md`.

#### D2. Programmatic Image Verification for Live Publishing (owner-approved 2026-11-18)
Sandbox sessions cannot inspect images by eye. A product may be set `active = true` automatically when its image passes ALL of these programmatic checks:
- (a) sourced from a reputable manufacturer/supplier product page that matches the exact product name and pack size;
- (b) HTTP 200 status;
- (c) valid image MIME type (`image/jpeg`, `image/png`, `image/webp`);
- (d) dimensions `>= 500x500px` and file size `> 15KB`;
- (e) uploaded cleanly into Supabase via `add_product_photo` (stored object exists and `products.images` references it).
Keep `active = false` only if no verified image is found, or the item is on the PCPB regulatory HOLD list. Record in `HANDOFF-live.md` which checks were actually performed for each product; never report a check as passed that was not run.

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
