# HANDOFF: product-link spinner (wip-fix-product-link-spinner)

Date: 2026-11-21

## Problem
Opening a product link (/?product=<slug> or /p/<slug>.html) on a phone showed only the purple loading spinner for a long time.

## Findings
- Supabase is healthy: project oewvtbnmyombbtggamor ACTIVE_HEALTHY, get_store_catalog() runs in about 12 ms and returns 1713 rows; anon can read the product columns the shell needs.
- mobile-shell/app.js quickDeepLink() (the one-product fast path) used PRODUCT_COLS, which was never declared anywhere in the repo. Every call threw a ReferenceError, was caught, and the link fell back to waiting for the whole catalogue (2 RPC pages + categories + product-names.json) before opening the product, so the spinner stayed up.

## Done
- app.js: declared PRODUCT_COLS (id,slug,name,category_id,price,old_price,stock,featured,images,unit,variant_group,variant_label; never `cost`).
- app.js: added withCover() so the fast path rows get cover_image from images[0], matching what get_store_catalog returns.
- Diff: +6/-2 in mobile-shell/app.js only (commit 8b3a16a).

## Left
- Open PR into main and let CI run (mobile-shell Playwright tests); watch for any test that mocks the products REST call.
- Bump the app.js cache version (?v=43 in index.html and shell-route-loader.js) if returning visitors keep the old file.
- After merge and green Actions: open a product link on a phone and confirm the product page appears without a long spinner.
- Not reproduced on the live site (no network from this session); the cause is confirmed from the code and database only.
