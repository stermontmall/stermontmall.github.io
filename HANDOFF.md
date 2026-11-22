# HANDOFF: product-link spinner (wip-fix-product-link-spinner) + site speed (wip-site-speed)

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
- After merge and green Actions: open a product link on a phone and confirm the product page appears without a long spinner.
- Not reproduced on the live site (no network from this session); the cause is confirmed from the code and database only.

---

# Site speed (wip-site-speed, branched from wip-fix-product-link-spinner)

Date: 2026-11-21. Owner report: the website loads for a long time and lags. Owner then asked to "fix all the issues".

## Findings (from the repo and the live Supabase project)
- The database is not the bottleneck: `explain analyze select * from get_store_catalog()` = about 16 ms for 1,713 active rows (1,626 products after pack sizes are folded).
- The cost is client-side. mobile-shell/app.js `loadCatalog()` downloads the whole catalogue before categories, chips, the drawer, Deals, "More like this" and every product link can work. It asks for 1,000 rows per request and `apiAll()` waits for page 1 before it asks for page 2, then also waits for /product-names.json. Every request is `cache: 'no-store'`, so a second product link (each one is a full page load) repeats all of it. Only the 7 build-time cards on the home page show meanwhile.
- Generated /p/<slug>.html and /c/<slug>.html pages (what Google and shared links open) run shell-route-loader.js: fetch the whole homepage, parse it, load app.js?v=44, and only then start the Supabase requests. A prefetch in index.html alone does not help them (the homepage is parsed there, its scripts never run).
- sw.js v6 forced a server re-check (`cache: 'no-cache'`) of every .js/.css/.json file on every load, including app.js, which is on the critical path.
- Noted, NOT changed: index.html has no `<!DOCTYPE html>` before `<head>` (a stray one sits after `</head>`), so browsers render it in quirks mode. generate-products.mjs and other build scripts write this file and I could not run the build, so changing it risks the build and layout. Needs its own change with a build run and visual check.
- Noted, NOT changed: `_headers` is ignored by GitHub Pages (its own header says so).
- Noted, NOT changed: index.html loads app.js?v=43 while shell-route-loader.js loads ?v=44 (same file, two cache entries). Harmless; with sw.js v7 any edit reaches returning visitors on their next visit.
- Supabase performance advisor: only INFO/WARN items (about 108 backup tables without primary keys, 8 unused indexes, 39 multiple-permissive-policy warnings on products/categories/orders etc.). Nothing that slows the catalogue request. Not changed: loosening or merging RLS policies is a security change and needs its own review.

## Done
- index.html: inline "Catalogue prefetch" script at the top of `<head>`. It starts the categories request and both 1,000-row catalogue pages in parallel before app.js is downloaded, and answers app.js's own fetch() calls for those exact URLs (app.js unchanged). The answer is also kept in localStorage (`shell.catalogPrefetch.v1`) for 5 minutes, so the next product link or return visit within 5 minutes is instant; a background refresh runs when the copy is older than 1 minute. Any mismatch or failure falls through to the normal fetch. To undo: delete that script block.
- shell-route-loader.js: the same prefetch block runs at the start of generated /p/ and /c/ pages, in parallel with the homepage fetch and the app.js download.
- sw.js v7: scripts/styles with a `?v=` address are served from the cache and refreshed in the background; pages, JSON and unversioned files stay network-first.
- Nothing else touched: no seo-*.mjs, category-hubs.mjs, check-product-pages.mjs, no Supabase schema/data changes.

## Left
- Open a PR from wip-site-speed into main (it also carries the spinner fix commit 8b3a16a) and let CI run, especially mobile-shell/shell.test.py and any test of shell-route-loader.js: look for tests that count catalogue requests, assert the sw.js text, or stub window.fetch.
- After merge and green Actions: on a phone open https://stermontarcade.co.ke/ and check category chips appear quickly; open a /p/ product link and a /c/ category link; open two different product links in a row; reload once to confirm service worker v7 takes over.
- Prices and stock can be up to 5 minutes old for a visitor who loaded the shop within the last 5 minutes. After changing a price in the admin portal, reload twice (or wait 5 minutes) before checking the live shop.
- Possible next steps, not done: one-call catalogue (a single RPC returning everything in one response, or fewer columns), fold product-names.json into the RPC, doctype fix with a build run, tidy the products SELECT policies.

Status update 2026-11-22: PRs #1013 (spinner + site speed) and #1020 (product card opens full page) are merged into main. PR #1020 was merged while `validate` and `route-regression` were failing; the cause was not read (Actions logs not reachable from the session).

---

# ImageKit product images (PR #1022, branch imagekit-product-image-delivery-2026-11-22)

Date: 2026-11-22. Status: NOT safe to merge yet.

## Done (this session)
- shell-route-loader.js: generated /p/ and /c/ pages now load /imagekit-url.js before /mobile-shell/app.js?v=44 (commit 5111c50). Before this, window.STM_IMAGE_URL was undefined on those pages (the loader skips the homepage's scripts), so shell product cards there silently kept the original photo URLs. A failed load of the helper is ignored, so app.js still falls back to originals.

## Left
- `validate` and `route-regression` fail on #1022 (they also failed on #1020). The logs were not readable from this session: open the failed job in Actions, copy the first failing assertion or error, and fix that before merging. Re-run after commit 5111c50 first; it may change the result for tests of the /p/ and /c/ shell pages.
- Open one Supabase Storage product image through https://ik.imagekit.io/w6hxfnwmw/supabase/tr:w-480,q-75,f-auto/<storage image URL> in a browser; only a GitHub Pages photo has been confirmed through the proxy so far.
- Not changed, harmless: storefront-live.js renderThumbs() assigns t.onerror twice, so the first (retry the original) is overwritten by the second (drop the thumbnail); the window-level listener in imagekit-url.js normally handles the retry first.
