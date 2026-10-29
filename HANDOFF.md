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

## Task C: product page clean-up (IN PROGRESS, branch `wip-seo-cleanup`, NOT merged)
Found on `/p/pentagon-50ec-insecticide-1-litre.html` (build `cdf72d1`):
1. Meta description repeats the product name: `Buy X in Kenya for KSh 1,800. Buy X 1 Litre… In stock...`.
2. Product JSON-LD `description` runs a heading into the text (`...Why Choose Pentagon 50EC Thrips and aphids suck sap...…`) because newlines are flattened before clipping.

Done so far:
- [x] Step 1: new `seo-fixes.mjs` added (fixes both items, per-page try/catch). NOT wired in yet, so it changes nothing on its own.
- [ ] Step 2: wire it in with one line in `seo-overrides.mjs` (after the seo-product-extras line).
- [ ] Step 3: owner runs the product-pages workflow from the branch (or locally with `node generate-products.mjs && node seo-kenya.mjs && node seo-overrides.mjs`) and checks the Pentagon page source: meta description has no second "Buy", JSON-LD description has no heading run. Check `/p/abasi-5-ec.html` still has its FAQ and breadcrumb.
- [ ] Step 4: merge to `main` only after step 3 passes.

Decisions:
- Fix lives in a new post-processing file instead of editing the large generator, so it is easy to switch off (delete one line).
- JSON-LD description now uses only the page's paragraphs; if a page has none, it is left unchanged.
- Not changed: meta-refresh redirects (GitHub Pages cannot send 301; a Cloudflare layer would), reviews/stars (already only from real approved reviews).
