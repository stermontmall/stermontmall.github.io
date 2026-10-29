# HANDOFF

Rule: work in small steps, push each to `wip-<task-name>`, update this file with every push, merge to `main` only when finished AND tested.

## Task A: shareable + permanent product links (DONE, on `main`)
- Clean `/p/<slug>.html` URLs from `products.slug` (ids never change); old id and old slug URLs redirect; DB triggers keep slugs stable. 19 products renamed, backup table `products_slug_backup_20261029`.
- Manual browser test, 2026-10-29, done by the owner: PASSED popup URL is `/p/<slug>.html`; Back closes the popup and stays on the homepage; add to cart then Back returns to the homepage in one press; pack size changes the price; old `#p-` link opens the product; WhatsApp enquiry has a clean link; old long URL redirects to the current page; test order placed successfully.
- Not confirmed: the exact wording of the original 9-step checklist (the 9th step was not identified). Pasting a link directly into a fresh incognito tab then pressing Back shows a blank tab: normal browser behaviour, not a bug.
- TODO: delete or mark the test order. Rollback: `update products p set slug=b.slug from products_slug_backup_20261029 b where b.id=p.id;`

## Task B: SEO for product pages (MERGED to `main` via PR #49, 2026-10-29)
Nobody can guarantee #1 on Google; this removes on-page gaps.
- `seo-product-extras.mjs` runs from `seo-overrides.mjs` (inside try/catch; delete the 2 lines at the top of `seo-overrides.mjs` to switch it off). It gives product pages: real h3 headings and lists in the description, an "At a glance" table (active ingredient, formulation), a "Safe use" box (label, PCPB number, PPE, pre-harvest interval; no invented dosages), hub breadcrumb + BreadcrumbList JSON-LD, and a "Related guides and categories" box (also on category pages).
- Verified on the live build: `/p/abasi-5-ec.html` has all five additions, valid ProductGroup JSON-LD with brand Abasi, breadcrumb Home > Agrochemicals > Crop Insecticides > product.
- Already existed: Product JSON-LD (KES, InStock), FAQ + breadcrumb schema, Kenya titles/meta under 160 chars (`seo-kenya.mjs`), aggregateRating only from real approved reviews (3 reviews on 1 product today).

### Left
- [ ] Spot check one pest-control page and one non-chemical page in a browser
- [ ] Dosage / dilution / PHI numbers: add per product from the label in the admin (a line `APPLICATION RATE` then the label text); never invented
- [ ] Collect real customer reviews (stars appear only for approved reviews)
- [ ] Optional: shorter titles with no cut-off name (`seo-kenya.mjs`); Search Console: submit `sitemap-products.xml`, request indexing for top pages

## Task C: product page clean-up (DONE, MERGED to `main` via PR #50, verified 2026-10-29)
Found on `/p/pentagon-50ec-insecticide-1-litre.html`: (1) meta description repeated the product name; (2) Product JSON-LD `description` ran a heading ("Why Choose ...") into the text.
- `seo-fixes.mjs` (wired in from `seo-overrides.mjs`) fixes both. Checked on the built pages on `main`: 0 pages with a repeated "Buy ... Buy ..." meta description, 0 pages with "Why Choose" in the JSON-LD description, Pentagon JSON-LD is clean, `/p/abasi-5-ec.html` still has FAQ + breadcrumb schema.
- Minor, left as is: the JSON-LD description is clipped at 500 characters with "..." (it can end mid-sentence).

Rollback: delete the `seo-fixes.mjs` import line in `seo-overrides.mjs` (or revert `ea50617`).

Decisions:
- Fix lives in a new post-processing file instead of editing the large generator, so it is easy to switch off (delete one line).
- When the meta description had a repeated "Buy", the descriptive middle sentence is dropped entirely (simple and safe); it can be improved later in `seo-kenya.mjs`.
- Not changed: meta-refresh redirects (GitHub Pages cannot send 301; a Cloudflare layer would), reviews/stars (already only from real approved reviews).

## Task D: modern product titles + descriptions + Kenya terms for ALL products (IN PROGRESS, branch `wip-modern-titles`, NOT on `main`)
Goal (owner): titles and descriptions that do not look old-school; add more search terms (at least 30 Kenyan ones); apply to every product.

### Done
- [x] Step 1: `seo-titles.mjs` added. It rewrites title, og/twitter title and meta description of every `/p/*.html`:
  - 3 title looks, picked per product by a hash of its id, e.g. `<name> Price in Kenya | KSh X`, `Original <name> | KSh X, Pay by M-Pesa`, `<name> in Kenya: KSh X | Order Online`.
  - If the full name does not fit in 68 characters it tries the other looks first, and only clips the name as a last resort (this also closes the "cut-off name" item in Task B).
  - Skips any product that has a hand-written entry in `seo-overrides.json` (those win).
- [x] Step 2: wired in from `seo-overrides.mjs` (one import line after the `seo-fixes.mjs` line, inside try/catch). Only on this branch. The live site is unchanged: the workflow's push trigger and the 3-hour schedule only build `main`.
- [x] Step 3: Kenyan term bank (40 terms) added to `seo-titles.mjs`: buyer intent (price in Kenya, buy online Kenya, best price Kenya, where to buy in Kenya...), Swahili (bei nafuu, bei gani, nunua online, duka online Kenya, lipa kwa M-Pesa, agiza online), payment/ordering (M-Pesa, WhatsApp), trust words (original, genuine, top quality) and delivery places (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika, Nyeri, Kisii, Meru, Machakos, countrywide), plus Westlands / The Sarit Centre. Used three ways:
  - the description closing line rotates between 4 wordings (max 158 characters);
  - a VISIBLE box at the bottom of each product page (class `kenya-terms`): "Delivery across Kenya: ..." and "People also search: ..." (6 product phrases + 4 bank terms, rotated per product so pages do not repeat each other);
  - no hidden text, no meta keywords.

### Left
- [ ] Step 4: Actions tab > "Build product pages" > Run workflow > choose branch `wip-modern-titles`. It will commit rebuilt pages to this branch only. Then check the built pages: title length <= 68, description <= 158, no "Buy ... Buy", the `kenya-terms` box appears once per page, and `/p/abasi-5-ec.html` plus one pest-control + one non-chemical page still have FAQ, breadcrumb and Product JSON-LD. Check the box looks right on a phone.
- [ ] Step 5: owner approves the wording, then open a PR to `main`. Do NOT merge before step 4 passes. (Nothing has been run yet: the code is untested.)

### Decisions
- Same pattern as Task C: a new post-processing file, easy to switch off (delete the one import line, or revert the Task D commits).
- Only facts already on the site are used (name, price, stock, M-Pesa, WhatsApp, 47 counties). Delivery speed ("same day", "fast"), "free delivery", "guaranteed" and "trusted" are NOT claimed.
- "Original", "genuine" and "top quality" are used at the owner's request. They must be true for every product sold; the owner is responsible for those claims.
- Why a rotated, limited list and not all 40 terms everywhere: Google ignores or demotes keyword stuffing, so each page gets about 10 relevant phrases in readable form.
- `seo-kenya.mjs` is left untouched, so rollback is clean. Its "Buy ..." titles are simply replaced afterwards by `seo-titles.mjs`.
