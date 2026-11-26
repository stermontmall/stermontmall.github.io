## 2026-11-25 16:55 (Africa/Nairobi) - Instant indexing after product publishing (branch `wip-index-after-publish`)
- Done: added section 13 to `PUBLISHING_RULES.md` and to Neon `publishing_rules` (key `publish_products`): after products go live, send `repository_dispatch` event `catalog-changed` so Build product pages runs at once (IndexNow), then Google sitemap ping follows via workflow_run. Backup: `archive.publishing_rules_indexing_backup_20261125`.
- Not verified: the sandbox `GH_TOKEN` is invalid, so the dispatch was not tested from here. Test: `gh api -X POST repos/stermontmall/stermontmall.github.io/dispatches -f event_type=catalog-changed`.
- Rollback: restore `content` from the archive table by key.

## 2026-11-23 13:40 (Africa/Nairobi) — Indexing guard test updated for ImageKit (branch `wip-indexing-guard-imagekit`, NOT merged)

### Done
- `seo-indexing-guard.test.mjs`: removed the Supabase-era asserts (`SUPABASE_IMAGE_TRANSFORMS`, `storageImageTransformsEnabled = probe.ok`, `quality', '75'`). The generator now uses `imageKitUrl` via `optimizedImageUrl(source, width)` (imagekit-url.js). The test now asserts the ImageKit require, the `optimizedImageUrl` definition and the 320/900 widths. Canonical, robots, noindex and sitemap asserts are unchanged. Commit 66bbae5.

### Not verified
- Not run (no network/clone in this session). Re-run: `node seo-indexing-guard.test.mjs`.

### Next
1. Open a PR, run `node seo-indexing-guard.test.mjs`, merge.
2. Re-dispatch the rebuild: `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`
3. Then: broken Supabase photos on 4 static home cards; Neon Data API read from the browser (CORS/origin); run `node link-check.mjs` and `node seo-check.mjs`.

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


## 2026-11-23 14:20 (Africa/Nairobi) - WhatsApp number change (branch `wip-whatsapp-number`)
- Done: replaced old WhatsApp number 254748888230 / +254 748 888 230 / 0748888230 with 254789514060 / +254 789 514 060 / 0789514060 in 1,990 files (generators, static pages, generated pages, feeds, JSON, docs). Zero old-number matches remain in the repo. Node test failures (14 of 33) are identical on main (missing modules), unrelated.
- Next: merge PR, then rebuild pages if generators are re-run. Neon still holds the old number in 54 `products` descriptions and 1 `publishing_rules` row; update after merge or the next rebuild will bring it back.
- Check: `grep -rIlE "748 ?888 ?230" --exclude-dir=.git . | wc -l` should print 0.

## 2026-11-23 14:10 (Africa/Nairobi) - WhatsApp number change merged
- Done: PR #1076 squash-merged to `main` (40fb333). Old WhatsApp number replaced by 254789514060 everywhere in the repo. PR checks `validate` (needs checkout.html) and `route-regression` (needs shell-route-loader.js) were already failing on every PR today; neither file exists on main. Merged over them at owner request.
- Next: update Neon (54 `products` descriptions + 1 `publishing_rules` row still hold the old number; back up first), then re-run product pages build: `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`.
- Check: `grep -rIlE "748 ?888 ?230" --exclude-dir=.git . | wc -l` should print 0.

## 2026-11-23 14:15 (Africa/Nairobi) - Neon WhatsApp number updated
- Done: Neon `public.products.description` (54 rows) and `public.publishing_rules.content` (key `publish_products`) now use 254789514060 / +254 789 514 060. Zero old-number matches left in products, rules, blog_posts, service_posts. Backups: `archive.products_whatsapp_backup_20261123` (54 rows), `archive.publishing_rules_whatsapp_backup_20261123` (1 row).
- In progress: product-pages rebuild dispatched on main (run 45162737985).
- Rollback if needed: update `public.products`/`public.publishing_rules` from the two archive tables by id/key.

## 2026-11-23 14:20 (Africa/Nairobi) - product-pages rebuild failed (not caused by number change)
- Blocked: `product-pages.yml` runs #866-#871 all fail since 09:30 today (last success #849, 2026-11-21) at step "Test Google indexing safeguards": `node seo-indexing-guard.test.mjs` line 38 expects `imageTransformsRequested = process.env.SUPABASE_IMAGE_TRANSFORMS === 'true'` in the generator; that Supabase-era string is gone after the Neon migration. Fails identically before the WhatsApp change.
- Impact: none for the number. PR #1076 already replaced it inside the generated pages in `p/`, `c/`, `guides/`, `blog/`, `services/`, `pest-control/`; Neon rows updated. A rebuild from Neon would also produce the new number.
- Next: owner/Neon-migration session updates `seo-indexing-guard.test.mjs` (or the generator), then re-dispatch: `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`.


## 2026-11-26 — Local-intent SEO update (branch `seo/local-intent-kenya-cities-2026-11-26`)
- Updated the manually authored Nairobi landing page to target high-intent pest-control shop and agrovet supply searches, with clearer H2/H3 subtitles for product types, pack-size/price checks, Westlands pickup, Nairobi delivery areas and safe product selection.
- Updated the Mombasa landing page for pest-control products, fumigation supplies and agrovet products; added distinct Coast-area guidance and a transparent list of other major-city delivery enquiry locations. Explicitly clarifies there are no additional Stermont shop branches in those towns.
- Improved the services hub title, H1 and local city coverage section. Wording states that non-Nairobi service bookings are subject to confirmation and availability.
- Improved the Kenya-wide commercial pest-control supply page title, metadata, headings and service-area structured data for named city delivery enquiries. It distinguishes product delivery enquiries from on-site service coverage.
- Added the existing Mombasa landing page to the hand-maintained static entries in `sitemap.xml`; the product-page generator preserves static entries.
- Preserved all canonicals and URL paths. No product names, prices, stock, slugs or active flags changed. No generated product/category HTML or workflow files edited.
- Validation so far: JSON-LD parses on all four edited HTML pages; titles are under 60 characters; Mombasa URL now appears in root sitemap. Awaiting final diff review and CI/build validation.


## 2026-11-26 — Fix local SEO PR shell validation failures (branch `seo/local-intent-kenya-cities-2026-11-26`)
- Found exact failures from workflow run 45764478423 / job 139721970510: SSR home-grid test expected `/p/` anchors although actual SSR cards intentionally use owner-approved `?product=` customer links; query deep-link test expected canonical `/p/garden-set-250ml.html` but app.js left canonical at homepage.
- Updated `mobile-shell/shell.test.py` to assert at least six server-rendered `?product=` links and renamed canonical test to accurately describe product SEO canonical.
- Updated `mobile-shell/app.js` so active product overlays set canonical and og:url to the corresponding static `/p/<slug>.html`; categories retain their category URL and the homepage canonical returns when the product overlay is closed. No customer-facing link format changed.
- Bumped `index.html` app.js cache version from v53 to v54 as required.
- Commits: app.js `99cb9108b59cdf148c3fce579266aee30a3957da`; index.html `f6ad09a34820e4572797f8b7f5746ccab8492a49`; shell test `fc8fbaae26a482cd242f50e9ae131388c6929fb6`.
- Next: inspect CI for this branch; verify mobile-shell Playwright checks and SEO checks. Do not merge unless all required checks pass. If running locally, exact test command is `python mobile-shell/shell.test.py` (requires the repo's Playwright/Chromium setup).


## 2026-11-26 — Follow-up fix after browser regression (branch `seo/local-intent-kenya-cities-2026-11-26`)
- Inspected route-regression log from run 45766456533. Failures clustered around category direct-route cleanup, returning from tabs/cart, restoring/removing `?cat=`, and the product SEO canonical assertion.
- Root cause: while adding canonical/og:url synchronization to `syncProductMeta()`, the existing category URL cleanup `else if` branches were accidentally left attached to the Open Graph URL update `if`, instead of the route-selection `if/else if` chain. This could leave category paths and query state inconsistent whenever og:url did not need updating.
- Moved category path/query cleanup back into the route-selection chain and left canonical/og:url synchronization as independent updates. This preserves the selected category URL while a category is active and cleans the category route only when leaving it.
- Commit: `9e8d12a70df8eb6f39aa40d2a3bc5df80009f0ce`.
- Validation pending: new route-regression and SEO quality workflows must pass before PR merge or production deployment.

- Additional canonical assertion diagnosis: `/?product=garden-set-250ml` initially selected the product's default pack and `productUrl()` used that pack slug, replacing the requested product slug. Updated `productUrl()` to preserve `PRODUCT_ROUTE_SLUG` for deep-link sessions (including selected-pack hash), while ordinary card opens still use the selected pack slug. Commit: `433799770cef1ad8cbb2242b83a72de6fc2b1ec2`.


## 2026-11-26 — Deep-link canonical metadata regression fix
- Latest validation on HEAD `9228d5f` failed both route-regression and SEO quality workflows on one assertion: opening `/?product=garden-set-250ml` did not leave the product SEO canonical at `/p/garden-set-250ml.html`. 179/180 route checks passed; other shell-route and SEO preflight steps passed before the browser suite stopped the quality gate.
- Updated `openDeepLink()` to synchronously set both canonical and og:url from the requested static product slug before rendering the product overlay. This covers legacy `?product=` entry and direct static product routes without changing customer-facing share URLs.
- Bumped `index.html` mobile-shell app script cache key from v54 to v55.
- Commits: app.js `8c511a8e218ea209921a792867fcfb19a66de3fc`; index.html `753b053943acb711c2d64e918287a22e563830a8`.
- Re-run both validation workflows on the new HEAD before merge. PR #1182 remains open and unmerged; SEO changes are not live.


## 2026-11-26 — Host-independent canonical browser assertion
- The latest full shell route run reached 179/180 checks; the remaining canonical assertion compared the absolute canonical URL against the production domain even though Playwright serves the site on a local ephemeral origin. The observed canonical path was correct (`/p/garden-set-250ml.html`); only the test's hard-coded hostname caused failure.
- Updated the assertion to compare the canonical URL pathname, preserving the requirement that the deep link resolves to `/p/garden-set-250ml.html` while allowing the test server's local hostname.
- Commit: `1e5cc399b9ce00a08f9129656c17fd26450a407a`.
- Re-run route and SEO workflows on the new HEAD; PR #1182 remains open/unmerged and changes are not live.
