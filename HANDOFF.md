# HANDOFF

Rule: work in small steps, push each to `wip-<task-name>`, update this file with every push, merge to `main` only when finished AND tested.

## Task A: shareable + permanent product links (DONE, on `main`, branch `wip-permanent-product-links`)
- Clean `/p/<slug>.html` URLs from `products.slug` (ids never change); old id and old slug URLs redirect; DB triggers keep slugs stable. 19 products renamed, backup table `products_slug_backup_20261029`.
- Verified read-only 2026-10-29: 259 products, 0 empty/duplicate/clashing slugs, triggers present, batch 2 pages and redirects exist on `main`.
- STILL OPEN: manual browser test of the 9-step checklist (see `wip-permanent-product-links` HANDOFF.md). Code was merged after code checks only.
- Rollback: `update products p set slug=b.slug from products_slug_backup_20261029 b where b.id=p.id;`

## Task B: SEO for product pages (branch `wip-seo-product-pages`, NOT merged)
Goal: rank product pages as high as possible on Google Kenya (Masterpiece Fumigation is the benchmark). Nobody can guarantee #1; this removes on-page gaps.

### Already in place before this task (found in the repo, not redone)
- `generate-products.mjs`: Product/ProductGroup JSON-LD (name, image, description, sku, offers KES + InStock/OutOfStock, return + shipping), `aggregateRating` + `review` from REAL approved reviews only (3 reviews on 1 product exist today, so only that page gets stars), FAQPage + BreadcrumbList, canonical, og, M-Pesa/delivery text, related-products links, category pages with guides + FAQ, hub categories, sitemap, merchant feed.
- `seo-kenya.mjs`: "Buy <product> in Kenya | KSh X" titles, meta descriptions under 160 chars, "cheapest ... in Kenya" guides. It removes the fake brand "Stermont Arcade" when no real brand is known (correct: brand must be the manufacturer).
- DB descriptions are already long (about 2,000 characters) and include active ingredient, uses, how to mix, safety.

### Done on this branch
- [x] Step 1: `seo-product-extras.mjs` (tested on a fixture page, idempotent, syntax checked):
  1. description text becomes real `<h3>` headings, bullet lists and paragraphs (was one plain pre-line block)
  2. "At a glance" table (active ingredient from the ACTIVE INGREDIENT section, formulation from the name code such as EC/SL/SC)
  3. "Safe use" box on agrochemical and pest-control pages: read label, PCPB registration number, PPE, pre-harvest interval for crop products. Generic rules only, NO dosages or PHI numbers invented
  4. hub breadcrumb (Home > Agrochemicals > Crop Insecticides > product) and matching BreadcrumbList JSON-LD
  5. "Related guides and categories" box on product pages and category pages (cheapest-price guide, blog guides, sibling categories, hub)
- [x] Step 2: wired in WITHOUT touching the workflow file (the GitHub connector has no permission to edit `.github/workflows`): `seo-overrides.mjs` now imports `seo-product-extras.mjs` first, inside try/catch, so a failure cannot block the build. `seo-overrides.mjs` is already a workflow step and a trigger path, so merging to `main` rebuilds the pages automatically. To switch off: delete the 2 lines at the top of `seo-overrides.mjs`.

### Left
- [ ] Dry run of the whole pipeline on real data (needs network: `node generate-products.mjs && node seo-kenya.mjs && node seo-overrides.mjs`) and spot check pages
- [ ] Product-specific dosage, dilution and PHI numbers: NOT added. They must come from each label or the manufacturer. Add them to the product description in the admin (a line such as `APPLICATION RATE` then the label text) and they will show up automatically as headings.
- [ ] Real customer reviews: ask buyers for reviews; stars only appear for products with approved reviews (no fake ratings)
- [ ] Optional: shorter titles without a cut-off name (seo-kenya.mjs)
- [ ] Merge to `main` after the dry run passes and a browser look at 3 pages (one agrochemical, one pest-control, one non-chemical)

## Decisions
- Post-processing script instead of editing the 40 KB generator: smaller change, same pattern as `seo-kenya.mjs`, easy to revert.
- No fabricated data anywhere (ratings, dosages, PHI, registration numbers).
