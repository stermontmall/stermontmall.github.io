## 2026-11-28 11:30 (Africa/Nairobi) - STEP 1 sales and checkout audit: findings only, NO code or data changed (branch `wip-sales-checkout-audit`, note-only)
- Task list from owner (do in order, one at a time): 1 sales/checkout, 2 live verification, 3 Google indexing, 4 risky redirect mappings (ask before Neon edits), 5 review the order-email PR. Close PR #1268 without merging. Do not roll back #1273.
- Neon `public.orders` has only 4 rows ever (first 2026-11-17): 17 Nov 2 (1 paid, 1 declined, same customer retry, KSh 3,300), 20 Nov 1 paid KSh 29,700, 26 Nov 09:49 1 declined KSh 5,050. None since. All `pay_verified=false` (staff set status by hand). `mpesa_payments` (STK) = 0 rows, `mpesa_c2b_payments` = 0 rows, `payment_settings` empty, `sales` = 0 rows. Orders before 17 Nov were in the old Supabase project: they are NOT in Neon, so the size of the drop cannot be measured from Neon.
- Checkout today: `checkout.html` (redesign merged 27 Nov, PR #1224; delivery fees 47 counties, commit 8cfa69c) is MANUAL M-Pesa only: customer pays Paybill 714777, account 0748888230 (owner confirmed 27 Nov: stays), types the code + amount, `rpc/create_guest_order` saves the order as pending. No STK push, no automatic payment check, no card. Card/Paystack is not in the live checkout. `checkout-deferred.js` is the old Supabase drawer (has `card:false`, calls Supabase edge functions paystack-init / paystack-status that went with the Supabase project); it is not loaded by checkout.html. Whether a Paystack key was TEST or LIVE cannot be read from the repo or Neon: unknown.
- Orders ARE saved (4 rows). Customer confirmation + staff alert: `order-emails.js` (EmailJS service_zoho, template_n60yao4) runs in the browser after the save; best effort, never breaks checkout (wrapped in try/catch). Customer email only if an email was typed (optional field): 3 of 4 orders had one. New-order emails are NOT logged anywhere; `order_notifications` has 1 row (status email "delivered" to a customer, 28 Nov 08:07 UTC). So delivery of the new-order emails is unverified.
- DB side is healthy: role `anonymous` can EXECUTE create_guest_order and track_order and read delivery_fees; 47 active fee rows; 676 of 683 active products are orderable (stock>0). `create_guest_order` was changed 27 Nov (backup `archive.create_guest_order_backup_20261127`); trigger requires pay_amount >= subtotal.
- Likely causes of the drop (from timeline; evidence strength in brackets):
  1. Migration outage 22-23 Nov [strong]: `checkout.html` was deleted 23 Nov 01:56 and the Neon checkout merged 14:25 (about 12 h with no checkout); the home page showed no products until the Neon shell fix (23 Nov 12:45-13:00); `validate` / `route-regression` have been red since.
  2. Checkout redesign 27 Nov 08:07-08:52 never tested with a real or test order [open]; zero orders since 26 Nov 09:49. Cannot tell from here if checkout works on a phone.
  3. Friction [structural]: manual Paybill + typing an M-Pesa code, no card, no STK push; checkout needs a working Neon Auth anonymous token (`/token/anonymous`) first, else customers see "Could not start a secure session". CORS for that call cannot be tested from the sandbox.
  4. Search traffic risk from the 27 Nov page/redirect rebuild (#1273) [unproven]: needs Search Console clicks by day.
- NOT run / cannot run from here: live checkout, a test order, real email delivery, Paystack, Search Console. Exact checks for the owner: (a) on a phone open https://stermontarcade.co.ke, add a product, Checkout, place one test order with a fake code (it will be saved as pending: delete or decline it in admin); (b) confirm the browser console shows no error on `/token/anonymous`; (c) confirm the customer and `support@stermontarcade.co.ke` get the EmailJS emails (check EmailJS dashboard history).
- Decision needed from owner: (1) approve me to prepare, on a wip- branch, a test-order check plus a small fix list (log new-order email results to `order_notifications`, optional Paybill C2B auto-check), or (2) give me old Supabase order counts per day to measure the real drop first.
- Next: owner answer, then step 2 (live verification). Nothing was edited in code or Neon in this step.

## 2026-11-28 11:35 (Africa/Nairobi) - Audit of the 801 old-URL mappings; 4 redundant rows removed (branch `wip-trim-redundant-redirects`)
- Audit (deployed main 736c47762): 797 redirect pages + 4 live product pages; every target exists; no chains; no redirect pages in the sitemaps. 717 rows go to category pages, 84 to products (all active; 2 out of stock).
- Removed 4 rows whose old address is a live product (amistar-250-sc-fungicide-5l, amistar-top-325-sc-fungicide-5l, ed21-30w-fly-catcher, ridomil-gold-mz-68wg-fungicide-1kg).
- Open for owner: about 27 rows send an old pack size to a different pack; `bat-crp-bat-repellent-1-litre` (liquid) goes to `bat-repellant-powder-250g`. That row comes from Neon `product_slug_redirects`, which wins over this CSV, so changing it needs a Neon edit (not done).
- Not run: live site.

## 2026-11-28 11:25 (Africa/Nairobi) - One page per product; old addresses redirect (branch `wip-one-page-per-product`, PR open)
- Found: PR #1264 made every old slug and id address a full self-canonical page: 1,448 pages and 1,463 sitemap URLs for 683 active products (about 760 duplicates). Google index check showed 208 of 637 products indexed, mostly "Discovered - currently not indexed".
- Done: only real products and pack sizes (each its own page, as in #1264) get full pages; renamed slugs, id addresses and retired duplicates are redirect stubs again and never in the sitemap. Merged in the `data/old-url-redirects.csv` list from `wip-persist-old-redirects-v2` (PR #1268, supersede it: do not merge separately). Tests updated: seo-indexing-guard, no-static-share-links.
- Checks: fixture build of 73 live products + 5 fake old slugs: 73 full pages, 78 stubs, 0 stubs in sitemap. NOT run: live Neon build, live site.
- Next: PR checks, merge, wait for "Build product pages", then check p/ count (~700-900 incl. CSV stubs) and sitemap-products (~650).

## 2026-11-28 11:05 (Africa/Nairobi) - Old-URL redirect fix merged with current main (branch `wip-persist-old-redirects-v2`, PR open)
- Done: merged origin/main (01318d4df) into the redirect-persistence work; kept main's Neon `getHistoricalSlugs()` and the indexable-sitemap filter, plus the new `old-url-redirects.mjs` step. Tests pass: old-url-redirects, seo-indexing-guard, sitemap-indexable, check-product-pages, category-hubs.
- Not run: live Neon build, live site (no network from sandbox).
- Next: wait for PR checks, merge, wait for "Build product pages", open a few old URLs live.

## 2026-11-28 09:20 (Africa/Nairobi) - PR #1261 visible Pickup-label browser-test fix (branch `wip-ci-mock-imagekit-products`, NOT merged)
- Done: in `mobile-shell/shell.test.py`, replaced the two hidden-radio `.check()` calls with clicks on the visible `.seg label` for Pickup. Commit `39281730d89c67eae24a77346f20708b4e0b9ced`; PR: https://github.com/stermontmall/stermontmall.github.io/pull/1261.
- Final checks on that commit: `validate` SUCCESS; `route-regression` SUCCESS; `verify-pricing` SKIPPED.
- Scope: only the two approved test lines changed in this fix. Existing ImageKit fixture retained. No checkout.html, main, workflows, generated files, or Neon data changed. No third fix attempted. PR remains open and unmerged.

## 2026-11-28 09:15 (Africa/Nairobi) - PR #1261 ImageKit browser-test fixture (branch `wip-ci-mock-imagekit-products`, NOT merged)
- Done: added the approved `imagekit_proxy` test-fixture response in `mobile-shell/shell.test.py` for real ImageKit product-photo URLs. Commit `1dbb607da9039a415ac0302ce61ecf4178f0326a`; PR: https://github.com/stermontmall/stermontmall.github.io/pull/1261.
- Checks on that commit: `validate` FAILED at "Run mobile shell browser regression suite"; `route-regression` FAILED at "Test full shell on direct product and category URLs"; `verify-pricing` SKIPPED. Both browser jobs timed out selecting checkout's pickup radio (Playwright Locator.check, 30s); the radio was obstructed by overlapping SVG/bar/header elements. No `N/180 passed` summary was present in the captured logs.
- Scope: only the approved test fixture changed in the code commit. No checkout/site code, workflows, generated pages, or Neon data changed. No second fix attempted; PR remains open and unmerged. Main untouched.
- Next: diagnose the checkout browser-test interaction separately, with owner approval before any additional code change.

## 2026-11-28 00:45 (Africa/Nairobi) - `wip-fix-indexing-tools` MERGED to main (84db25b9)
- Done: Build product pages passed and committed 37c07482; Pages deploy of it succeeded. Both sitemaps on main: 0 noindex/non-canonical/missing entries (823 and 668 URLs). Google sitemap ping submitted all 5; indexing check run #91 passed (150 checked, 131 indexed; cumulative products 203 of 637).
- Tests: only mobile-shell/description.test.mjs and seo-titles.test.mjs failed, same as plain main. Live site not fetched from the sandbox.
- Not yet seen: a post-build ping going through the "send" path on GitHub after the 3h cooldown. `wip-persist-old-redirects` NOT merged.
- Next: check a later "Google sitemap ping" log for "Sitemap changed since".

## 2026-11-28 00:45 (Africa/Nairobi) - Sitemap ping and indexing checker fixes (branch `wip-fix-indexing-tools`, NOT merged)
- Cause 1: skipped "Google sitemap ping" runs end in success and restarted the 3h cooldown, so post-build pings were almost always skipped. The gate now uses the last run whose submit step succeeded.
- Cause 2: scheduled runs are far fewer than the cron asks; the index checker chose its batch by the clock, so batches were missed. It now uses GITHUB_RUN_NUMBER.
- Branch includes `wip-sitemap-indexable-only` (do not merge that one separately). Does not include `wip-persist-old-redirects`.
- Checks: new gate script run against live run history (cooldown and no-change skips; the send path with a simulated sitemap change); batch simulation covers all sitemap pages; workflow YAML parses; SEO tests pass. NOT run: the workflows on GitHub, live build.
- Open: product-pages cron is also delayed (not edited, rule 5); publish steps must send `catalog-changed`. Site audit fails at the Pa11y step.
- Next: owner OK, merge into main, check the "Google sitemap ping" log, then the next "Google indexing status" run.

## 2026-11-27 23:20 (Africa/Nairobi) - Sitemaps list only indexable pages (branch `wip-sitemap-indexable-only`, NOT merged)
- Found: sitemap.xml listed 22 pages that are noindex (21 `/c/`, fashion and cars included) or canonicalised elsewhere (privacy.html).
- Done: `sitemap-indexable.mjs` + test; `generate-products.mjs` filters both sitemaps. No generated files committed, no Neon data changed.
- Checks: new test, seo-indexing-guard, seo-shell-redirect, seo-shell-chrome, check-product-pages, category-hubs, seo-meta pass; one-product fixture build ran. NOT run: live Neon build, browser suite, live site.
- Next: owner OK, merge, wait for "Build product pages". `wip-persist-old-redirects` also edits generate-products.mjs and this file; resolve any HANDOFF conflict by keeping both entries.
## 2026-11-27 23:10 (Africa/Nairobi) - Old-URL redirects now survive rebuilds (branch `wip-persist-old-redirects`, tested locally, NOT merged)
- Done: `data/old-url-redirects.csv` (801 old slugs: the 4 redirect commits 15635486, 699be3e8, 04e4e7ce, 18741e12, plus the 84 Neon rows, checksum matched). `old-url-redirects.mjs` writes them after all real pages; live pages are never overwritten; gone targets go to `/c/`. Builder now asks Neon (not Supabase) for renames and warns if refused.
- Checks: two full local rebuilds (fixture of 683 live products, no pack-size grouping): 801/801 addresses have a page, 797 redirect pages, 0 dead targets, 0 chains, 0 in sitemaps, same output both times. link-check 0 problems; tests listed in product-pages.yml and seo-pr-quality.yml pass. NOT run: live Neon build, live site.
- Replaces `wip-redirects-agro-pest-remaining` (its 700 redirects are in the CSV): do not merge that branch.
- Owner decisions: (1) merge to main; (2) allow Neon role `anonymous` to read renames: `GRANT SELECT (old_slug, product_id) ON public.product_slug_redirects TO anonymous;` (not run). Until then new renames must be added to the CSV. (3) 273 addresses in the 1,000-row Search Console export (75 clicks) still have no page.
- Some CSV rows point to a different pack size or a close substitute (e.g. bat-crp liquid -> powder): review.
- Next: owner OK, merge the PR, wait for "Build product pages", open a few old URLs live.

## 2026-11-27 22:55 (Africa/Nairobi) - Keep old-URL redirects across rebuilds (branch `wip-persist-old-redirects`, IN PROGRESS, NOT merged)
- Owner said "Fix". Finding: Neon role `anonymous` has no SELECT grant on `product_slug_redirects` (read policy exists), and generate-products.mjs still asks Supabase for it.
- Plan: keep a permanent list in `data/old-url-redirects.csv`; build writes those redirect pages after all real pages. No Neon change without owner OK. Do not edit product-pages.yml.
- Next: write `old-url-redirects.mjs` + test, then run a fixture build. Command: `git checkout wip-persist-old-redirects`.

## PROGRESS CHECKPOINT — 27 Nov 2026, 22:48:41 (Africa/Nairobi)
**Summary:** Checked Search Console Performance export (last 3 months) against main 291bb35. Found old-URL redirect pages are being deleted by the product page build.
**Completed:** Export capped at 1000 rows: 800 product paths; 131 in current sitemap; 665 have no page file on main (224 of 299 product clicks). Redirect commit 15635486 added pages; build commit b267173b removed the sample checked. generate-products.mjs removes p/ and c/ each build, and reads product_slug_redirects from the old Supabase URL (no SLUG_REDIRECTS_JSON set in product-pages.yml found), not Neon (84 rows on 2026-11-27).
**Next:** Fix builder first (read redirects from Neon, keep category-fallback redirects across rebuilds), test on a wip- branch, then restore redirects. Do not merge wip-redirects-agro-pest-remaining before that. No code or data changed in this session.
**Blocked / owner action:** Owner approval for the fix. Live old URLs not tested from this session.
**Working branch / PR:** none

---
## 2026-11-27 20:45 (Africa/Nairobi) - Stable product page for pack sizes (branch `wip-stable-variant-pages`, NOT merged)
- Cause of "Sitemap lists a page that does not exist": 12 pack-size groups have sizes with the same `created_at`. The build ordered by `created_at` only, so the size chosen as the product page could change between builds and the other `/p/<slug>.html` disappeared.
- Fix (only `generate-products.mjs`): order by `created_at`, then `id`; every other size slug now gets a redirect page to the product page. No Neon data changed. No generated files committed.
- Checks: fixture build reproduced the flip before the fix and gave identical pages and sitemap in both input orders after it; the `*.test.mjs` files run by `product-pages.yml` and `seo-pr-quality.yml` pass. Not run: live catalogue build and browser suite (PR checks cover them).
- Next: owner review, merge the PR, wait for "Build product pages" then "SEO extras", then run "Daily SEO check" and confirm no missing sitemap pages.

## 2026-11-27 10:35 (Africa/Nairobi) - Redirects for remaining old agrovet and pest control URLs (branch `wip-redirects-agro-pest-remaining`, NOT merged)
- Owner: wanted every remaining old agrovet/pest control product URL redirected (not only the high-click ones).
- Old URL list came from `sitemap-products.xml` history (306 versions, fetched with `git fetch --depth=2500 origin main`): 1,693 slugs were in older sitemaps but not the current one; 1,603 had no file in `p/`; 718 were agrovet/pest control after keyword + manual review.
- Done: 700 new redirect pages in `p/` (all new files, nothing modified). 51 go to a live product (same product; 20 of them to a different pack size, see CSV), 649 go to the nearest `/c/` category page. Full old-to-new list: `HANDOFF-redirect-map-agro-pest.csv`.
- Skipped on purpose: 18 old slugs that still exist in Neon (12 active, 6 inactive incl. `sevin-dudu-dust-insecticide-50g` draft, `fugo-*`, `bipronex-cockroach-gel-bait-5g`). A redirect file at those paths would block the page build (build skips pages titled "Redirecting"), so they were removed from the set.
- Done in Neon: `product_slug_redirects` now has 76 rows (25 earlier + 51 now); 0 broken targets. No other Neon data changed.
- Checks: every target file exists, no loops or redirect chains, none of the 700 are in the current sitemap; `seo-indexing-guard.test.mjs` and `seo-shell-redirect.test.mjs` pass. Not tested on the live site (no network from sandbox).
- Not included: motorcycle spares, vehicles, electronics, fashion, kids, and safety gear (respirators, gloves, face shields, goggles, hazmat suits, helmets).
- To confirm with owner: different-pack redirects (e.g. Actellic 50EC 250 ml and 500 ml go to the 100 ml page).
- Next: owner OK, then open PR from `wip-redirects-agro-pest-remaining` into `main` and merge; open 2-3 old URLs on the live site to confirm. If a slug above is later published, delete its redirect page first.
- Verify: `git diff --name-only --diff-filter=A main -- p/ | wc -l` should print 700.

## 2026-11-27 08:05 (Africa/Nairobi) - pack prices and drafts
- Done: price fixes in Neon for some Fendona, Dimilin, Actellic, Chali Dudu and K-Othrine listings. Hidden drafts added: sevin-dudu-dust-insecticide-50g, dimilin-25wp-insecticide-1kg.
- Blocked: both drafts need an exact pack-size photo and a full Version 8 description. Photos received today do not confirm them (Dimilin photo reads 100 g; Sevin 50g label not legible).
- Next: get exact photos, then follow PUBLISHING_RULES.md section 12. Review live descriptions mentioning supplier price/listing (151 matched; awaiting owner's go-ahead).
- Branch: main (note only).

## 2026-11-26 (Africa/Nairobi) - New logo for WhatsApp link previews (MERGED to main 21:08, Pages deploy of 346aa28 succeeded)
- Owner attached the current (cart) logo: WhatsApp still shows the previous one.
- Done: added `stermont-arcade-logo-v2.png` (new address avoids a remembered preview), replaced `logo.png` with the same file, and pointed og:image/twitter:image that used logo.png or icon-512.png at it (HTML pages + generators). Product photo previews unchanged.
- Not changed: app icons, favicon, apple-touch-icon, logo.svg, logo-horizontal.* (still old artwork).
- Tests: root *.test.mjs pass except price-watch, sales-leads-report, seo-titles. Not tested in WhatsApp.
- Next: owner to check a new WhatsApp message. `wip-smart-search` still NOT merged.

## 2026-11-26 14:05 (Africa/Nairobi) - Replace Rafiki logo/branded photos (main, photo queue)
- Owner: keep products; swap Rafiki logo photos for real product photos. 8 affected: mende-mo-fire, stop-vermin-100g, agita-80g, bipronex-5g, cobra-45w, pantry-moth-trap, fly-bottle-trap, window-fly-stickers.
- Note: uploader skips names that already succeeded, so replacements need NEW names (why the earlier Agita fix never ran).
- In progress: first 4 queued as `*-new`. Next: read data/photo-results.json, check image_source, update only `images` in Neon (old URLs saved here), then catalog-changed dispatch.

## 2026-11-26 12:00 (Africa/Nairobi) - Faster product links, tested, merging (branch `wip-fast-product-links`)
- Done: spinner over Home on `?product=` links, early fetch of /p/<slug>.html, ProductGroup (pack-size) pages now parse, shell-route-loader app.js v=58.
- Tests: shell 180/180 + node tests pass. Simulated 1.5s delay per file: `?product=sevin-dudu-dust-200g` 3.6s -> 2.1s.
- Left: direct /p/ links still slow (loader fetches `/`, loads scripts one by one, refetches the page: ~5.1s in the same simulation). Sizes with no own /p/ page (e.g. trevin-dudu-dust-200g) still use the slow live lookup. product-links.js throws harmless "module is not defined" in the browser.

## 2026-11-26 11:50 (Africa/Nairobi) - Faster product links (branch `wip-fast-product-links`)
- Problem (owner): product links hang on Home before the product opens. Cause: no CSS used the `deep-open` flag, product fetch waited for app.js; shell-route-loader.js pinned app.js v=53.
- In progress: spinner + early fetch in index.html, app.js v=58. Next: `python3 mobile-shell/shell.test.py`, timed headless check, merge.

## 2026-11-26 11:28 (Africa/Nairobi) - Purple titles fix deployed
- Merge da40e2f is included in the successful GitHub Pages deploy of 8cadbe1. Build product pages passed for da40e2f. Site audit was still running when last checked.
- Next: owner checks a few products on the live site after a hard reload.

## 2026-11-26 11:20 (Africa/Nairobi) - Shop markdown headings FINISHED and merged to main (from `wip-shell-markdown-headings`)
- Done: shop view shows `##`/`###` descriptions under purple titles, no raw markdown, dash lists. app.js `?v=57`. No Neon data changed.
- Tests: description-headings 22, product-description-html 61, shell 180/180, navigation, no-classic-hop, seo-description-check, seo-indexing-guard pass; phone-size preview of a sample checked. `mobile-shell/description.test.mjs` failure is pre-existing.
- Next: owner hard-reloads the shop and checks a few products on the live site (not reachable from the sandbox).

## 2026-11-26 11:15 (Africa/Nairobi) - Shop markdown headings: code saved, NOT merged (branch `wip-shell-markdown-headings`)
- Done: `mobile-shell/app.js` handles `##`/`###`, hides `**` and link marks, shows dash lines as lists; `index.html` app.js `?v=` 57; new checks in `mobile-shell/description-headings.test.mjs` (22 passed).
- Not verified: shell.test.py passed 180/180 after the app.js edit (only the headings test changed since); phone-size visual preview not done (last run was interrupted).
- Next (waiting for owner's go-ahead to merge): `python3 mobile-shell/shell.test.py && node mobile-shell/navigation.test.mjs && node product-description-html.test.mjs`, preview, then merge to main. `mobile-shell/description.test.mjs` failure is pre-existing.

## 2026-11-26 11:20 (Africa/Nairobi) - Shop view: markdown headings as purple titles (branch `wip-shell-markdown-headings`)
- In progress: owner wants all descriptions auto-organised under purple titles. Found: `splitProductDescription` (mobile-shell/app.js) ignores `##`/`###`/`**` (188 of 440 active products use `##`). Static /p/ pages already handle them.
- Next: fix app.js, bump `?v=` in index.html, run `node mobile-shell/description-headings.test.mjs && python3 mobile-shell/shell.test.py`, merge.

## 2026-11-26 10:30 (Africa/Nairobi) - Description subtopics as purple headings (branch `wip-description-subheadings`)
- Task (owner): product description subtopics (e.g. "Where it may be useful", "Choosing the correct pack size", FAQ) must look like the purple "Product overview" heading, permanently.
- Found: Neon descriptions (e.g. `trevin-dudu-dust-200g`) store each subtopic as a plain line on its own (sentence case or ALL CAPS, no `##`). `mobile-shell/app.js` `splitProductDescription` only knows UPPERCASE labels and `product-description-html.mjs` only knows `##` and uppercase labels, so the heading lines collapse into body text (static pages even mis-file them into guessed sections).
- Done: `findHeadingLines()` added to `mobile-shell/app.js` (shop overlay) and `product-description-html.mjs` (static /p/ pages). Heading lines render as purple headings like "Product overview"; two in a row = title + purple subtitle (`h4.pc-sub` in the shell, `<h4>` on static pages, styled in `generate-products.mjs` and `seo-description-layout.mjs`); ALL CAPS lines shown in sentence case; first line stays overview text; FAQ heading gives the accordion. Conservative: needs >= 2 runs of <= 3 short unpunctuated lines each followed by a real paragraph or FAQ question. `index.html` app.js `?v=` 55 -> 56.
- Done: section 14 "DESCRIPTION HEADING FORMAT" added to `PUBLISHING_RULES.md` and Neon `publishing_rules` (key `publish_products`). Backup: `archive.publishing_rules_headings_backup_20261126`. Rollback: restore `content` from that table by key.
- Tests: `node product-description-html.test.mjs` (61 checks), `node mobile-shell/description-headings.test.mjs` (18), `python3 mobile-shell/shell.test.py` (180/180), seo-description-check, seo-indexing-guard and navigation tests pass; headless render shows h3/h4 colour rgb(91,33,182) = Product overview.
- Pre-existing, not touched: `node mobile-shell/description.test.mjs` already fails on main at "buying guide boilerplate removed" (the shell does not strip the PRODUCT BUYING GUIDE text that the static generator strips).
- Next: merge PR, then rebuild static pages so /p/ pages pick up the new headings: `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main` (generated pages are never edited by hand). Hard-reload the shop after deploy (app.js v=56).

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
- Re-run both validation workflows on the new HEAD; PR #1182 remains open/unmerged and changes are not live.


## 2026-11-26 — Host-independent canonical browser assertion
- The latest full shell route run reached 179/180 checks; the remaining canonical assertion compared the absolute canonical URL against the production domain even though Playwright serves the site on a local ephemeral origin. The observed canonical path was correct (`/p/garden-set-250ml.html`); only the test's hard-coded hostname caused failure.
- Updated the assertion to compare the canonical URL pathname, preserving the requirement that the deep link resolves to `/p/garden-set-250ml.html` while allowing the test server's local hostname.
- Commit: `1e5cc399b9ce00a08f9129656c17fd26450a407a`.
- Re-run route and SEO workflows on the new HEAD; PR #1182 remains open/unmerged and changes are not live.
