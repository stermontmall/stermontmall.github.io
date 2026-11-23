# HANDOFF: Neon page build (branch wip-neon-build)

Date: 2026-11-23. Goal: make the 30-minute "Build product pages" workflow work again on Neon (Supabase was deleted), without losing any page Google has already indexed.

## Findings (verified 2026-11-23)
- Last bot commit "Update product pages and sitemap" is 2026-11-21 06:39 UTC. The scheduled build has not saved anything since.
- `product-pages.yml` calls scripts that do not exist on main: `catalogue-count-guard.mjs`, `seo-catalog-guard.mjs`, `check-product-pages.mjs`, `seo-titles.mjs` (this one is continue-on-error). The build fails at the first missing required step, so nothing is deleted and the Nov 21 pages and sitemap are intact.
- `generate-products.mjs` still reads Supabase (`SB` URL, `products`, `reviews`, `product_slug_redirects`). It already supports `PRODUCTS_JSON`, `REVIEWS_JSON`, `SLUG_REDIRECTS_JSON` env hooks, so no edit to that 130 KB file is needed to switch the data source.
- DANGER: the generator runs `rmSync('p')` and `rmSync('c')`, then writes pages ONLY for active products, and rebuilds `sitemap.xml` / `sitemap-products.xml` from those pages (and only products with stock > 0).
- Neon `public.products` (restored 2026-11-23): 1,612 rows, 136 active (all with a site-hosted photo), 1,476 inactive. A plain rebuild from Neon would delete ~1,476 existing /p/ pages and drop them from the sitemaps. Do NOT run an unprotected rebuild.
- Neon has `reviews` and `product_slug_redirects` with the columns the generator expects. No variant groups exist in Neon (variant_group is null everywhere).

## Done
- Branch `wip-neon-build` created from main (be21abf).
- Added `scripts/export-neon-catalog.mjs`: reads active products + categories, approved reviews and slug redirects from Neon and writes `.build/products.json`, `.build/reviews.json`, `.build/slug-redirects.json` in the exact shape of the old Supabase REST responses. Refuses to export (exit 1) if fewer than 50 active products (`MIN_ACTIVE_PRODUCTS`).

## Left (in order)
1. `scripts/preserve-legacy-pages.mjs`: before the generator runs, copy `p/` aside; after it runs, put back every product page (file has `name="stm-id"`) that was not regenerated, and add those URLs back to `sitemap-products.xml` and `sitemap.xml` with their old `lastmod` from `sitemap-state.json`. Alias/redirect pages are not product pages and are handled by the generator.
2. Replace the missing guard scripts: recover `catalogue-count-guard.mjs`, `seo-catalog-guard.mjs`, `check-product-pages.mjs`, `seo-titles.mjs` from git history (`git log --diff-filter=D -- <file>`), strip Supabase calls, or drop the steps that no longer apply.
3. Edit `.github/workflows/product-pages.yml`: add `npm install --no-save pg`, run the exporter with `NEON_DATABASE_URL`, set `PRODUCTS_JSON`, `REVIEWS_JSON`, `SLUG_REDIRECTS_JSON` for the generator step, run the preserve script, remove the Supabase preconnect step (it inserts the deleted project's URL into index.html).
4. Test: run `workflow_dispatch` on the branch with push disabled and compare the new `sitemap-products.xml` URL list with main's (no URL may disappear). Only then merge to main.
5. After merge: run "SEO auto index" (IndexNow) and "Google indexing status" from the Actions tab.

## Decisions
- Keep `generate-products.mjs` unchanged; switch data source through its env hooks.
- Legacy pages of inactive products are preserved, not rebuilt, so their current content, images and indexing stay as they are. Needs owner confirmation: whether those 1,476 pages should stay public.
- Not merging to main until step 4 passes.

## Not possible from the chat that wrote this
- Running workflows or reading Actions logs. The owner must press Run workflow in the Actions tab and share any error.
