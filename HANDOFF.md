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
