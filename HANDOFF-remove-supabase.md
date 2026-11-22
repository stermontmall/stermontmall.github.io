# HANDOFF: remove Supabase (branch wip-remove-supabase)

Decision (2026-11-23): remove ALL Supabase from the site, no replacement, no backup needed. The Supabase project was already deleted permanently by the owner. Work stays on this branch until finished and tested.

## Done
- Branch created from main (37f141d).
- Deleted all edge function source: supabase/functions/* (stk-push, stk-status, mpesa-mode, mpesa-callback, payments-in, fetch-photo, find-photo, read-page, upload-photos).
- Deleted all of supabase/sql/ (24 files).
- Deleted root SQL: supabase-mpesa.sql, supabase-orders.sql, setup-track.sql, setup-builder-tasks.sql, setup-daraja.sql, setup-first-order.sql.
- supabase/ folder no longer exists on this branch.

## Left (not yet done)
1. Client JS still calls the deleted project (REF oewvtbnmyombbtggamor): chat.js, account-panel.js, site-links.js, catalog-v10.js, sw.js, product-reviews.js, product-trust.js, recent-orders.js, search-log.js, admin-*.js, checkout-handoff.js, kili-pages.js, shell-route-loader.js. Remove or stub these calls.
2. Build/CI scripts that query Supabase: check-product-pages.mjs, catalogue-count-guard.mjs, seo-*.mjs, data-health.mjs, link-check.mjs, price-watch.mjs, product-watch.mjs, stock-report.mjs, sales-leads-report.mjs, tools/build_product_pages.py, scripts/*.mjs. Without a data source the build will fail.
3. Archived folder removed/daraja-20261112/ (old Supabase M-Pesa function copies).
4. Generated pages (p/*.html, index.html, account.html) embed Supabase references.
5. Docs: AGENTS.md, CLAUDE.md, PUBLISHING.md, HANDOFF*.md, PUBLISH-PRODUCTS-RULE.md.
6. Run build and CI, then merge to main.
