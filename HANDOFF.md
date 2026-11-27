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

- 2026-11-22: PR #1030 merged (dc89ec4b): product descriptions fall back to the published /p/ page when Supabase REST returns 402 (app.js v=46). Outage cause: Supabase exceed_cached_egress_quota; see HANDOFF-live.md.

---

# PR #1037 (merged 2026-11-22, squash 26c2881): temporary Neon admin page

Date: 2026-11-22. Status: MERGED. Only `neon-admin.html` (new, noindex) and this file changed; the storefront, mobile shell, index.html and tests are the same as main.

## What happened
- Earlier commits on the PR branch corrupted mobile-shell/shell.test.py and switched the storefront to the Neon API. Both were reverted to main's versions before the merge, so neither is in main. (An earlier version of this section described a shell.test.py repair; that repair is not in main.)
- The `validate` check on the PR failed at "Build product and category pages" (`node generate-products.mjs`): HTTP 402 from Supabase, `exceed_cached_egress_quota` (see the 2026-11-22 outage note above). Not caused by the PR; main fails the same way until Supabase is restored. The PR was merged with that check red, on the owner's decision.

## Left
- Restore Supabase (upgrade the plan or remove the spend cap), then re-run `validate` on main and confirm it is green.
- Owner's Neon Auth account still has to be approved in `admin_profiles` before /neon-admin.html works: open the page, use "Create first admin account", send the Neon user ID it shows.
- neon-admin.html imports https://esm.sh/@neon/auth without a pinned version. Pin it after checking in a browser which published version the sign-in works with (not done: no browser in the session, and the package name/versions on npm were unclear).
- Storefront catalogue reads are still on Supabase. Switching them to Neon needs its own PR, with index.html's prefetch block and mobile-shell/shell.test.py updated together.

---

# Neon admin sign-in fix (branch wip-neon-admin-followups, commit c544a93)

Date: 2026-11-22. Status: pushed to the branch, NOT merged, NOT tested in a browser.

## Problem
On https://stermontarcade.co.ke/neon-admin.html the sign-in page showed "Your login session expired. Sign in again." The page is on a different origin from the Neon Auth host, and Neon's docs say `authClient.token()` returns no token unless the client sends credentials (cookies) cross-origin.

## Done
- neon-admin.html: `createAuthClient(AUTH,{fetchOptions:{credentials:"include"}})`; `token()` tries `auth.token()` first, then falls back to `auth.getSession()` (`data.session.token`).

## Left
- Merge this branch (PR from wip-neon-admin-followups into main), wait for GitHub Pages, hard-reload /neon-admin.html and sign in. If the same message appears, the site's domains (stermontarcade.co.ke and stermontmall.github.io) probably have to be added as allowed/trusted origins in the Neon Auth settings in the Neon console.
- Then approve the owner's Neon user ID in `admin_profiles` (see above).
- 2026-11-23: PR #1076 merged - store WhatsApp number changed to 254789514060 (see HANDOFF-live.md).

---

# PR #1104 link-check failure (branch seo/internal-link-canonical-audit-2026-11-23)

Date: 2026-11-24. Status: fix pushed (commit 182be48), CI result not yet seen.

## Problem
`validate` failed at "Broken and placeholder links (link-check.mjs)" on generated p/promax-20ec-insecticide-250ml.html: broken links /c/pest-control-and-fumigation, /c/agrovet-and-farm-supplies, /c/general-merchandise (and likely more above line 25 of the log).

## Cause
Neon `products.description` for the two Promax 20EC listings (and other products) contains Markdown links such as `[Pest Control and Fumigation category](https://stermontarcade.co.ke/c/pest-control-and-fumigation)`: extensionless and built from the category NAME, not the real slug (real: pest-control-fumigation, agrovet). general-merchandise is a real category with 0 active products, so no page is built. category-link-normalizer.mjs only matched `/c/<slug>.html`, and was never run on p/ pages.

Neon scan of descriptions (2026-11-24): bad targets found: pest-control-and-fumigation (5 products), general-merchandise.html (5, empty category), bed-bug-killers without .html (3, real slug). Others already end in .html and exist.

## Done
- category-link-normalizer.mjs: accepts extensionless links, maps name-based slugs (pest-control-and-fumigation -> pest-control-fumigation, agrovet-and-farm-supplies -> agrovet), leaves /c/ and /c/index.html alone.
- product-link-normalizer.mjs: runs the category normalizer on p/ pages only (after the generated pages and c/ exist, outside JSON-LD and breadcrumbs). Dead links become plain text.
- Checked with a local simulation of the 3 failing links; not run against the real catalogue build.

## Left
- Read the new `validate` run on PR #1104. If other links still fail, copy the first lines of the "Broken and placeholder links" step (lines 1-24 were never seen).
- Optional data clean-up (not done, needs owner OK): edit those product descriptions in Neon so they link to the real slugs.

- 2026-11-26: merged `wip-shell-markdown-headings` - shop view renders markdown headings as purple titles (app.js v=57).

- 2026-11-26: merged `wip-fast-product-links` - product links show a spinner and load sooner (app.js v=58).

- 2026-11-28: merged `wip-fix-indexing-tools` (84db25b9) - sitemap ping cooldown, index-check batches, indexable-only sitemaps.
