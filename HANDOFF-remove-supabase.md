# HANDOFF: remove Supabase (branch wip-remove-supabase)

Decision (2026-11-23): remove ALL Supabase from the site, no replacement. Work stays on this branch; do not merge to main until finished and tested.

## Done
- Branch created from main (37f141d).
- Inventory started: code search shows about 2,100 files mention "supabase".

## Known Supabase surface (from code search)
- supabase/functions/* (stk-push, stk-status, mpesa-mode, mpesa-callback, payments-in, fetch-photo, find-photo, read-page, upload-photos)
- supabase/sql/*, root *.sql files (supabase-mpesa, supabase-orders, setup-*.sql)
- Client JS: sw.js, catalog-v10.js, chat.js, product-reviews.js, product-trust.js, recent-orders.js, search-log.js, admin-*.js, checkout-handoff.js, site-links.js, kili-pages.js, shell-route-loader.js
- Build/CI scripts: *.mjs guards (seo-*, check-product-pages, catalogue-count-guard, data-health, link-check, price-watch, product-watch, stock-report, sales-leads-report), tools/build_product_pages.py
- Generated pages: p/*.html, index.html, account.html
- Docs: AGENTS.md, CLAUDE.md, PUBLISHING.md, HANDOFF*.md

## Left
1. Full inventory of runtime dependencies (client JS that reads/writes Supabase).
2. Remove client calls, then build scripts that query Supabase (build will fail without a data source: check-product-pages.mjs, catalogue-count-guard.mjs).
3. Delete supabase/ and *.sql files.
4. Update docs and operating rules.
5. Test build and CI before any merge.

## Risk
Without a data source the live catalogue, orders and M-Pesa checkout stop working. Do not merge until the user confirms the replacement (or a static-only site) is ready.
