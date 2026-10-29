# HANDOFF

Rule: work in small steps, push each to `wip-<task-name>`, update this file with every push, merge to `main` only when finished AND tested.

## Task A: shareable + permanent product links (DONE, on `main`)
- Clean `/p/<slug>.html` URLs from `products.slug` (ids never change); old id and old slug URLs redirect; DB triggers keep slugs stable. 19 products renamed, backup table `products_slug_backup_20261029`.
- STILL OPEN: manual browser test of the 9-step checklist (homepage popup URL, Back/Cart, pack sizes, old #p- links, WhatsApp link, old URL redirect, test order). Rollback: `update products p set slug=b.slug from products_slug_backup_20261029 b where b.id=p.id;`

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
