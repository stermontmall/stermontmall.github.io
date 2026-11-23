## 2026-11-23 13:00 (Africa/Nairobi) — Shell falls back to catalog-snapshot.json when Neon is unreachable (branch `wip-neon-diag`)

Home page still showed no Neon products after #1067/#1069. Headless test (stubbed Neon) renders fine, so the failure is the real browser->Neon request. app.js v=50: tries Neon first; on any failure loads same-site `/catalog-snapshot.json` (136 active products + 93 categories exported from Neon 2026-11-23) so the shop is never empty; the real error is shown/logged (`window.STM_LAST_ERROR`). Verified headless with Neon blocked: 8 real cards render.
Snapshot is static: regenerate after product changes (SQL on `storefront_products`/`categories`, see commit). Next: find why the browser cannot read the Neon Data API (CORS/origin/auth) and fix it.

## 2026-11-23 12:50 (Africa/Nairobi) — Shell Neon requests made CORS-simple (branch `wip-neon-live-shell-2`)

PR #1067 merged but the home page still showed no Neon products. Suspected cause: app.js sent `Range`/`Range-Unit` headers and `cache:'no-store'` (adds Cache-Control/Pragma), which force a CORS preflight the Neon Data API may refuse. Now plain GETs with `limit`/`offset`; app.js v=48. Not verified live (no network). Next: merge, hard-reload, check products; if still empty, check browser console for the failing request.

## 2026-11-23 12:45 (Africa/Nairobi) — Live home page restored on Neon (branch `wip-neon-live-shell`, NOT merged)

### Found
- `main` had NO `mobile-shell/app.js` (deleted in 5ea1f6ae) but `index.html` still loads `/mobile-shell/app.js?v=46`, and the prefetch block + app.js called the deleted Supabase project. Result: live home shows banners and "Shop by department" but no products.

### Done
- Restored `mobile-shell/app.js` from 5ea1f6ae^ and rewired its data layer to the Neon Data API (anonymous, read-only): catalogue from view `storefront_products` (136 active rows, same columns as before), categories from `categories`, product details/deep links from `products`. No Supabase left in app.js.
- `index.html`: removed the Supabase catalogue prefetch block, preconnect now points at Neon, `app.js?v=47`.
- Neon Data API CORS allows only https://stermontarcade.co.ke.

### Not verified
- No network from the sandbox: not opened in a browser, not run against the live API. `node --check` and navigation.test.mjs pass. no-static-share-links.test.mjs already fails on main (site-links.js missing).
- 4 static cards in index.html still point at deleted Supabase photos (products are inactive in Neon).

### Next
1. Merge PR, wait ~1 min, open https://stermontarcade.co.ke and confirm products appear.

