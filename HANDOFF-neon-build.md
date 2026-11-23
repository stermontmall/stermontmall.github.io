# HANDOFF: Neon page build (branch wip-neon-build)

Date: 2026-11-23. Goal: make the 30-minute "Build product pages" workflow work again on Neon (Supabase was deleted), without losing any page Google has already indexed.

## Findings (verified 2026-11-23)
- Last bot commit "Update product pages and sitemap" is 2026-11-21 06:39 UTC. The scheduled build has not saved anything since.
- `product-pages.yml` calls scripts that do not exist on main: `catalogue-count-guard.mjs`, `seo-catalog-guard.mjs`, `check-product-pages.mjs`, `seo-titles.mjs` (this one is continue-on-error). The build fails at the first missing required step, so nothing is deleted and the Nov 21 pages and sitemap are intact.
- `generate-products.mjs` still reads Supabase (`SB` URL, `products`, `reviews`, `product_slug_redirects`). It already supports `PRODUCTS_JSON`, `REVIEWS_JSON`, `SLUG_REDIRECTS_JSON` env hooks, so no edit to that 130 KB file is needed to switch the data source.
- DANGER: the generator runs `rmSync('p')` and `rmSync('c')`, then writes pages ONLY for active products, and rebuilds `sitemap.xml` / `sitemap-products.xml` from those pages (and only products with stock > 0).
- Neon `public.products` (restored 2026-11-23): 1,612 rows, 136 active (all with a site-hosted photo), 1,476 inactive. A plain rebuild from Neon would delete ~1,476 existing /p/ pages and drop them from the sitemaps. Do NOT run an unprotected rebuild.
- Category pages: a category with fewer than 5 products is generated `noindex`, and an active-only rebuild shrinks every category. Handled by the preserve script (keeps the old category page while it lists more products).
- `merchant-feed.xml` is also rebuilt from active products only, so it will shrink from about 6 MB to the 136 products with photos. Not handled yet (see Left, item 6).
- Neon has `reviews` and `product_slug_redirects` with the columns the generator expects. No variant groups exist in Neon (variant_group is null everywhere).

## Done
- Branch `wip-neon-build` created from main (be21abf).
- `scripts/export-neon-catalog.mjs`: reads active products + categories, approved reviews and slug redirects from Neon and writes `.build/products.json`, `.build/reviews.json`, `.build/slug-redirects.json` in the shape of the old Supabase REST responses. Exits 1 if fewer than 50 active products (`MIN_ACTIVE_PRODUCTS`).
- `scripts/preserve-legacy-pages.mjs` (`snapshot` before the generator, `restore` after): puts back old /p/ pages and old redirect pages the generator did not write, keeps an old /c/ page when it lists more products than the new one, re-adds those URLs to both sitemaps and `sitemap-state.json` with their old lastmod, and exits 1 if any /p/ or /c/ URL from the old sitemaps is missing afterwards. Not run yet (no way to run code from the chat that wrote it).

## Left (in order)
1. Recover or replace the missing guard scripts: `catalogue-count-guard.mjs`, `seo-catalog-guard.mjs`, `check-product-pages.mjs`, `seo-titles.mjs`. Find them in git history (`list_commits` with the path, or `git log --diff-filter=D -- <file>`), strip Supabase calls, or drop the steps that no longer apply. The tests `catalogue-count-guard.test.mjs`, `seo-catalog-guard.test.mjs`, `check-product-pages.test.mjs`, `seo-titles.test.mjs` show what each must do.
2. Edit `.github/workflows/product-pages.yml`: add `npm install --no-save pg`; run the exporter with `NEON_DATABASE_URL`; run `preserve-legacy-pages.mjs snapshot`; run `generate-products.mjs` with `PRODUCTS_JSON=.build/products.json REVIEWS_JSON=.build/reviews.json SLUG_REDIRECTS_JSON=.build/slug-redirects.json`; run `preserve-legacy-pages.mjs restore` right after it (before the SEO post-processing steps); remove the "Speed - connect to the shop database early" step (it inserts the deleted Supabase URL into index.html).
3. Make sure `.build/` is git-ignored (the workflow only `git add`s named paths, so this is a safety net).
4. Test: run the workflow with `workflow_dispatch` from the branch with the commit/push step disabled (or in a fork), then compare the new `sitemap-products.xml` URL list with main's. No URL may disappear. Only then merge to main.
5. After merge: run "SEO auto index" (IndexNow) and "Google indexing status" from the Actions tab.
6. Decide how to keep the Merchant feed from shrinking to only the 136 active products (probably keep the old feed items for legacy products, or accept the shrink because those listings have no working photos).
7. Neon-side: the daily Google indexing report is meant to be saved by `neon-automation-sync.mjs index`; the Neon tables were still empty on 2026-11-23. Check that the `NEON_DATABASE_URL` secret points at project restless-shape-79120240, database stermont.

## Decisions
- Keep `generate-products.mjs` unchanged; switch data source through its env hooks.
- OWNER DECIDED 2026-11-23: keep the ~1,476 existing pages of inactive products public (preserve them, do not rebuild them). Their current content and indexing stay as they are.
- Not merging to main until step 4 passes.

## Not possible from the chat that wrote this
- Running workflows or reading Actions logs. The owner must press Run workflow in the Actions tab and share any error.
