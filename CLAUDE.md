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
> SUPERSEDED for bulk posting: the pricing (`cost * 1.30`) and word-count (600–900 words) lines below are overridden by `

## AUTONOMOUS BULK PRODUCT PUBLISHING RULE (ZERO-PROMPT DEFAULT)

**Owner-approved canonical rule, 2026-11-18.** This section supersedes all older or conflicting bulk-publishing, pricing, inventory, image, and SEO instructions in this repository. It applies to every category on `stermontarcade.co.ke`.

### 1. ZERO-QUESTION AUTONOMY & PRE-ANSWERED EDGE CASES
Trigger: whenever the owner says **"Post [N] items on [Category]"**, execute continuously until the requested count is live. Do not ask clarifying questions or pause for confirmation. Do not create or publish anything unless a posting request is actually made.

- **Duplicates:** Before each insert, check existing `products` in Supabase using normalized product name, active ingredient/model, and pack size. Skip exact duplicates and continue discovering unique candidates until the requested count is reached.
- **Category mapping:** Resolve the exact Supabase `category_id`. If a subcategory is absent, use the closest existing parent category. Never leave `category_id` null.
- **Variants:** Use the existing `ProductGroup`/variant architecture when supported. Otherwise create distinct SKUs and pack-size slugs (for example `product-name-500ml`) following the current `main` generator pattern.
- **Currency/tax:** All prices are KES/KSh inclusive of applicable local taxes. Never use USD, ZAR, or NGN.
- **Missing price/image:** If no verifiable Kenyan price or no clean, downloadable, valid image can be sourced after checking trusted sources, skip that candidate and find another. Do not publish a placeholder or cracked image.
- **Completion:** Continue until [N] unique, eligible products are live. If genuinely impossible after reasonable source discovery, report the exact blocker and count; never fabricate products, prices, images, compliance status, or completion.
- **Git/deployment:** Commit to `main` if permitted. If branch protection requires a PR, create a branch, run and verify the build/checks, and provide one ready-to-merge PR link at the end. Never stop mid-batch for routine decisions.

### 2. CONTINUOUS MICRO-BATCH LOOP
Process in internal batches of five, end-to-end:
`discover unique Kenyan products/packs -> verify Kenyan source price -> calculate markup/floors -> download and validate image -> upload with add_product_photo -> write 800+ word SEO guide -> upsert Supabase active=true -> rebuild product pages and sitemap.xml -> checkpoint HANDOFF-live.md`.
Immediately continue to the next micro-batch. Save a checkpoint after each batch and whenever blocked.

### 3. TRUSTED KENYAN PHYSICAL-STORE SOURCE DIRECTORY
Use legitimate Kenyan businesses with physical Kenyan/Nairobi presence as price/specification sources, preferring wholesale/distributor prices and exact pack/model matches. Record the exact store name and source URL in `HANDOFF-live.md` for every product.

- **Pest control, agrochemicals, agrovets, seeds, fertilizers, livestock:** Osho Chemical Industries (Nairobi Industrial Area), Murphy Chemicals E.A. (Nairobi), Amiran Kenya (North Airport Rd, Nairobi), Twiga Chemical Industries (Nairobi), Lachlan Kenya (Nairobi), Ultravetis East Africa (Nairobi), Cooper K-Brands (Nairobi), Farmers Trend Kenya (Nairobi/Thika), Mkulima Young, Agriflora Kenya, Farmbiza Kenya, and established Nairobi agrovet/pest-control distributors (Industrial Area/CBD/Westlands).
- **Hardware, sprayers, tanks, irrigation, tools, solar, automotive:** Davis & Shirtliff (Nairobi Industrial Area/Westlands), Randolf Hardware, Buildmart Kenya, Metro Hardware, Chhani's, Karibu Hardware, Epicenter Africa, SunCulture, and AutoXpress Kenya branches.
- **Supermarkets, household, kitchen, pet, health/beauty, baby, cleaning:** Carrefour Kenya, Naivas, Quickmart, and Chandarana Foodplus branches.
- **Electronics, appliances, phones, computing, office:** Hotpoint Appliances Kenya (Sarit Centre/Industrial Area), Ramtons Kenya, Opalnet, authorized Luthuli/Moi Avenue distributors, Avechi Kenya, Phoneplace Kenya, Saruk Digital Solutions, and Text Book Centre.
- **Security/CCTV:** verified Hikvision and Dahua authorized Nairobi distributors (CBD/Westlands/Industrial Area).
- **Fashion, shoes, watches, sports:** verified Nairobi retail stores and official Kenyan brand outlets (Sarit Centre/Westlands/CBD).
- For any category not explicitly listed, identify reputable Kenyan physical retailers/distributors relevant to that category; verify the physical-store presence and exact listing rather than assuming it.

### 4. PRICING: FOUR-TIER MARKUP & PROFIT FLOORS
1. **Syngenta exclusion:** Do not change Syngenta pricing unless explicitly instructed.
2. **Baseline cost (KES):** lowest reliable Kenyan wholesale/distributor price from the source directory. If only reputable Nairobi retail prices are published, use `retail price * 0.85` as the estimated baseline and label it clearly in the handoff. Never invent a price.
3. **Markup:** baseline below KSh 20,000: +30% (`baseline * 1.30`); KSh 20,000–39,999: +25% (`* 1.25`); KSh 40,000–60,000 inclusive: +20% (`* 1.20`); above KSh 60,000: +17.5% (`* 1.175`).
4. **Guardrails:** final price must also satisfy at least a 15% net margin above baseline; round to nearest KSh 50; storefront price floor is KSh 200 per product/variant. Apply the higher price where the markup formula and 15% floor differ.
5. Record baseline, source, markup tier, rounding, and final KES price.

### 5. INVENTORY DEFAULTS
Every new product and pack variant: stock quantity 1000; low-stock threshold 20. In the current database schema these fields are `products.stock` (default 1000) and `products.low_at` (default 20), equivalent to the requested `stock_quantity` and `low_stock_threshold` concepts. Do not add duplicate columns unless the schema is deliberately migrated and all application code is updated.

### 6. IMAGE UPLOAD — ZERO CRACKING
- Find a clean, high-resolution image matching the exact product/model and pack size; no watermarks, blurry thumbnails, or generic substitutes.
- Download locally and verify HTTP 200, MIME type exactly one of `image/jpeg`, `image/png`, `image/webp`, intact dimensions at least 500x500, and file size greater than 15 KB.
- Upload image bytes to Supabase Storage using `add_product_photo`; never hotlink an external URL.
- Confirm the stored object exists and `products.images` references it before activation. Record only checks actually performed.
- Activate only when price, image, and regulatory gates all pass.

### 7. KENYAN REGULATORY / PCPB SAFETY
Before agrochemical/pest-control activation, cross-check `HANDOFF-live.md` and `docs/photo-upload-queue-2026-11-18.md`. Never publish withdrawn actives (including Acephate). Do not publish restricted actives (including Chlorpyrifos, Imidacloprid, 2,4-D Amine, Mancozeb) without label-accurate Kenyan restrictions and confirmation of applicable authorization. Never invent pesticide dilution rates; defer to the exact Kenyan-approved label and PPE directions. If regulatory status is uncertain, skip/hold and find a compliant alternative.

### 8. UNIQUE 800+ WORD GOOGLE.CO.KE SEO & STRUCTURED DATA
Every published item needs a unique, factual, non-templated guide of at least 800 words for Kenyan buyers:
- Meta title target 55–60 characters: `[Exact Product Name + Pack Size] Price in Kenya | Stermont Arcade` (fit the limit without truncation or misleading wording).
- Meta description target 145–155 characters, including exact KSh price, pack size, M-Pesa checkout, Sarit Centre/Westlands Nairobi pickup, and delivery across all 47 counties.
- Opening overview: 100+ words.
- Features, technical specifications, and pack details: 150+ words; only verified brand, pack, dimensions, active ingredient/specifications, formulation/build quality, shelf-life/warranty details.
- Practical Kenyan applications and safe usage guidance: 200+ words. Do not invent efficacy claims, directions, or chemical rates.
- Buying/pack comparison: 150+ words, with 2–3 natural internal links to relevant Stermont categories, guides, or `/services/` pages.
- Kenya ordering/pickup/delivery: 80+ words; M-Pesa, pickup at Sarit Centre (Westlands, Nairobi), delivery to all 47 counties, WhatsApp `+254 748 888 230`.
- Four buyer-focused FAQs totaling at least 150 words, synced one-to-one with FAQPage JSON-LD. Include valid Product/ProductGroup JSON-LD with `https://schema.org`, `priceCurrency: "KES"`, exact numeric price, and a one-year `priceValidUntil`. Do not claim rich-result eligibility or guaranteed rankings.

### 9. FINAL LIVE SYNC & REPORT
Set `active=true` only after all gates pass. Rebuild product pages and `sitemap.xml`; verify the live URLs and sitemap entries; checkpoint `HANDOFF-live.md`. At completion provide one concise table:
`Product Name | Pack Size | Baseline Cost (KES) | Final Price (KES) | Nairobi Source Store | Live URL`.
Include any skipped/held candidates and blockers separately.
