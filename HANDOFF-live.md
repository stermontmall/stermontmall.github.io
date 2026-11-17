# Live handoff — technical SEO

Date: 2026-11-15 (Africa/Nairobi)
Repository: stermontmall/stermontmall.github.io
Working branch: wip/seo-batch2-2026-11-15

## 2026-11-18 00:40 (Africa/Nairobi) — Security PR: lock down `stm_send_email` (branch `wip-security-revoke-send-email`)
- Done: read-only review. `public.stm_send_email(text,text,text,text,text,text)` is SECURITY DEFINER, ungated, does an outbound HTTP POST, and is executable by PUBLIC/anon/authenticated, so anyone could send email as the store. Only the `orders_send_emails` trigger calls it (as owner postgres). The five staff RPCs (`record_sale`, `reverse_sale`, `restock_product`, `record_loss`, `admin_list_accounts`) all check `is_staff()` inside, so no change needed.
- Added `supabase/sql/security_revoke_send_email_public.sql` (revoke from public, anon, authenticated; keep service_role; verify and rollback lines included) and `docs/security/security-definer-followup-2026-11-18.md`. NOT applied to the live database.
- Not touched: `stm_order_email_trg()` (order function, not exploitable as an RPC), checkout/order/voucher/tracking/review/M-Pesa/card functions.
- Next: owner reviews the PR; after merge apply the SQL file as a migration, run the verify query, place one test order and confirm a new `email_log` row plus the "received" email. Rollback: the `grant ... to anon, authenticated` line in the SQL file.
- Blocked / dashboard only: Supabase Auth "Leaked password protection" is off; enable it in the Supabase dashboard (not a migration).

## 2026-11-15 13:50 (Africa/Nairobi) — PR #776 `validate` job fix (branch `feat/final-cro-trust-service-pages`)
Failing step in the SEO pull request quality gate (run 43703801865, read with `gh run view 43703801865 --log-failed`): "Run mobile shell browser regression suite" (`python3 mobile-shell/shell.test.py`), 2 FAIL lines then `TimeoutError ... waiting for locator("#grid .card[data-id]")` at line 598. The same failure reproduces on a clean `main` checkout, so it was not caused by the PR's one-line `app.js` change.
- Done: `mobile-shell/shell.test.py` — the tests were stale against two owner-approved behaviours already in `app.js` / the early script: (1) the shell address after `/?cat=<slug>` is the clean `/c/<slug>.html` (catUrl, owner 2026-11-09), not `/`; (2) a phone reloading that address is sent back to `/?cat=<slug>` by the `stm-early` script, which skips bot and "headless" user agents, so the reload test now uses an ordinary phone user agent and serves a generated category page for every `/c/<slug>.html`. Result locally: 171/171 pass (only the sandbox's blocked outbound image requests, `ERR_TUNNEL_CONNECTION_FAILED`, had to be ignored in a throwaway copy that was not committed).
- Done: `generate-products.mjs` line 664 — missing closing backtick on the product-page `body` template (introduced in `763e406`, already on `main`), `node --check generate-products.mjs` failed with `SyntaxError: Unexpected token '{'`. Fixed.
- Done: `mombasa.html` — broken internal link `/c/home-living.html` (no such page) now points to `/c/home-kitchen.html`; `node link-check.mjs` reports 0 problems.
- Not changed: `mobile-shell/app.js` (the PR's `if (!RESTORE_CAT) refreshGrid();` stays as is; reverting it made no difference), so no `?v=` bump was needed.
- Next: watch the next CI run on PR #776. Steps that need the live catalogue could not run here (no DNS in the sandbox): `node generate-products.mjs`, `seo-kenya.mjs`, `seo-overrides.mjs`, `seo-titles.mjs`, `seo-safe-meta.mjs`, `seo-shell-redirect.mjs`, `node seo-check.mjs > seo-pr-report.md`. Re-run command: `gh run list --workflow seo-pr-quality.yml --limit 3` then `gh run view <id> --log-failed`.
- Note for the owner: `shell.test.py` still has "category redirect removed" checks that pass only because headless Chromium is exempt from the early redirect; they contradict the 2026-11-08 decision to bring the phone redirect back.

## Done
- Created a clean working branch from `main`; the earlier branch `wip/technical-seo-kenya-2026-11` is 100 commits ahead of main and contains unrelated changes, so it will not be merged or deployed.
- Audited the canonical domain, homepage metadata/schema, robots.txt, sitemap.xml, product/category generator, services generator/data, service hub, shipping page, service guide index and current navigation script.
- Updated `generate-products.mjs` in commit `875963bb9e9480a8b24a4f7bebf340d6d4a5aefa` so categories with fewer than five products get `noindex, follow`.
- Updated the category generator so `stermont-cars-for-sale` and `mens-fashion` are emitted at canonical root destinations `/cars-for-sale.html` and `/fashion.html`, with noindex redirect stubs at their old `/c/` URLs. The old paths are excluded from the generated category URL list; the destination paths are included.
- Batch 1 PR #763 was merged to `main` on 2026-11-15 at 08:39:35 UTC (11:39:35 EAT). Batch 2 is isolated on the review branch below; its changes are not yet merged or deployed.

## Batch 1 — merged to main in PR #763
- Updated `mobile-shell/shell.test.py` so the fixture intercepts the current `rpc/get_store_catalog` endpoint; the legacy products route remains available for product-detail requests.
- Updated `mobile-shell/app.js` homepage recommendation sorting to prioritize Pest Control, Agrovet, Home Appliances/Home & Kitchen, then Phones/Electronics, with featured listings first inside each department. This is a merchandising priority, not a claim about verified sales volume.
- Bumped the homepage mobile-shell cache URL from `?v=38` to `?v=39`; no CSS, navigation, cart, M-Pesa or WhatsApp implementation was changed.
- Updated `404.html` with a functional GET search form, links to key shop categories, and retained the original 404 fallback script, WhatsApp contact, page styling and noindex directive.
- Updated `generate-products.mjs` so the retired `/c/stermont-cars-for-sale.html` and `/c/mens-fashion.html` stubs redirect to the homepage with a canonical homepage URL and `noindex,follow`. Their root-level category pages remain available as separate destinations.
- Verified `CNAME` already contains exactly `stermontarcade.co.ke`; homepage canonical and OG URLs already use the primary domain.
- Verified `robots.txt` already allows crawlable assets, avoids blocking search/filter query URLs, disallows admin/account pages, and lists the primary, product, image, service and pest-control sitemaps. No change was necessary.
- Verified `sitemap.xml` and product/service/image sitemap generation are already handled by existing build scripts/workflows; no manual sitemap rewrite was made, to avoid overwriting automatically maintained product/blog/service URLs.
- No change was made to M-Pesa, cart, checkout, WhatsApp, CSS, navigation menus, CNAME or Supabase configuration.

## Batch 1 commits
- `e6f93167acb0db0f90353ba2671aff6080468f24` — fix mobile shell test fixture for catalogue RPC.
- `7e9560e7002246bb80a6fdc812b608cf620a9197` — improve branded 404 search and category recovery.
- `1a6738169ef1b50a1125fe85d1d96f79c1da741e` — prioritize key departments in homepage recommendations.
- `3b0953b78fe537c08cd87b177f2bffdd3c711b28` — refresh mobile shell script cache after recommendation update.
- `1ac428c072569de75424a2f4a9513e3d149a8ce3` — redirect retired legacy category URLs to homepage.

## In progress
- Validate the generator change against the repository's build workflow and link checker.
- Review service-page source data and county-page generator before adding the requested service and county pages.
- Review navigation priority changes without altering mobile-shell interactions or styles.

## Blocked / limitations
- This environment has GitHub repository access but no checked-out working tree to run Node locally.
- GitHub Actions have not yet been run for this branch. Do not claim build, schema or link checks passed until an actual run reports success.
- The existing `HANDOFF-live.md` and `HANDOFF.md` referenced in `CLAUDE.md` were not present on main; this file establishes the live handoff on the working branch.

## Next
1. Run the product-page workflow's existing Node tests and build on a review branch, without changing workflow files.
2. Confirm the two destination category pages are generated and old URLs redirect correctly.
3. Implement the remaining service/county pages in their source generators/data, then run link and sitemap checks.
4. Open a review PR only after the branch contains only the intended SEO commits and all available checks have been run.
5. Merge to main only after review and successful verification; then check the canonical live URLs.


## Batch 2 — review branch
- Created `wip/seo-batch2-2026-11-15` from the post-Batch-1 `main` branch.
- Updated `seo-meta.mjs` so product titles continue to target the high-intent phrase “Price in Kenya”, while product/category meta descriptions and the product-page tagline include the truthful Sarit Centre / Nairobi pickup wording. Existing 60-character title and 155-character description limits remain in place.
- Updated `generate-products.mjs` social metadata to include descriptive Open Graph and Twitter image alt text; category-card images now use descriptive product-photo alt text. Existing image dimensions, lazy loading for below-the-fold cards, eager/fetch-priority loading for the primary product image, and deferred footer scripts were preserved.
- Audited and retained the existing visible breadcrumb navigation: product pages render Home > Category > Product; category pages render Home > Category. Product and category pages already emit BreadcrumbList JSON-LD. Category BreadcrumbList now matches the visible breadcrumb path rather than inserting an extra “All categories” crumb.
- Confirmed existing Product JSON-LD uses `priceCurrency: KES`; category pages already emit ItemList JSON-LD. No duplicate or speculative Product ratings were introduced.
- Added a separate `LocalBusiness` JSON-LD entity for the user-specified Sarit Centre, Westlands coordination and pickup office, linked to the existing OnlineStore entity. Existing address, telephone, opening hours, M-Pesa and KES values are reused consistently.
- Deferred the homepage mobile-shell and analytics external scripts. Existing Supabase preconnect remains in place. Inline routing/schema scripts remain synchronous intentionally.
- Validation performed through repository content inspection: all three homepage JSON-LD blocks parse as valid JSON; generated Product KES, category ItemList, BreadcrumbList, image dimensions/lazy loading, primary-image eager loading and deferred homepage scripts were confirmed in source. GitHub Actions build/SEO tests are still required before merge.

### Batch 2 commits
- `c957e4b0fc49a62f5ad2a10fc082df76198c4204` — add descriptive social image metadata and align category breadcrumbs.
- `c8fed3f87ebf0404594aa04104bed6f69c2ac71e` — add Sarit Centre LocalBusiness schema and defer homepage scripts.
- `7c987f1452ad98425f45d3728839b63ef5bad84f` — strengthen product metadata with Nairobi pickup intent.
- `b0d416a31005355b4985f0dd7ea249baf3cf2529` — improve generated catalogue image alt text.
- `f59444d69f0cdd6f8b204211a98ee5df5807cd33` — standardize Sarit Centre pickup wording for Nairobi search intent.

## Batch 2 next steps
1. Run GitHub Actions on the review PR and inspect every failing SEO/build/mobile-shell check.
2. Review generated product/category output and schema validation before merge.
3. Merge only after the owner reviews the PR and all required checks pass.

## Batch 2 CI failure follow-up — 2026-11-15
- Inspected failed GitHub Actions run #281 (`43695811898`), job `validate` (`132755961286`). The first failing step was `Run mobile shell browser regression suite`; all subsequent SEO/build checks were skipped because the job exited early.
- Root cause was stale test assumptions, not a runtime storefront regression: test expected 12+ products in the initial viewport although the shell intentionally paginates 8 at a time; it checked later-page products before scrolling to trigger pagination; and it expected an old shopping-bag emoji fallback although current code intentionally renders an accessible `Photo unavailable` label after gallery fallback exhaustion.
- PR #766 was already merged at `2026-11-15T08:45:11Z` (merge commit `c943f91e5f5fa29740ef323d20df95f13ec6072e`) before this correction could be added. A merged PR cannot be updated; this follow-up branch is therefore cut from the current `main` for a new review PR.
- Updated `mobile-shell/shell.test.py` only: assert the 8-item first page, scroll to trigger subsequent-page loading before checking database-name fallback, and assert the current `.photo-unavailable` fallback. No production storefront code changed.
- Fix commit: `5f824ada30ceed54c4b63fbdf0904c5f90276d01`.
- New follow-up PR and fresh GitHub Actions run are required. Do not start Batch 3 until the follow-up validation is green.

- Follow-up run #282 (`43696263282`) exposed one further flaw in the first test correction: scrolling the long homepage fixture did not reliably intersect the pagination sentinel in Playwright. Replaced that timing-sensitive approach with a deterministic category-chip selection for the garden fixture, whose complete eight-item category page includes the test products; the test then returns to “For you” before continuing. This remains a test-only change.
- Deterministic test correction commit: `9ea9dacd7f30ef0c000841c91668422b046d87a1`. Awaiting the next PR Actions run.

- Follow-up run #284 (`43696393998`) passed the corrected initial-page, database-name and unavailable-photo assertions, then exposed two additional stale assumptions in the test sequence: it checked the Home & Kitchen image while viewing the garden category, and checked/used the multi-size product from the paginated “For you” feed rather than its Home & Living category.
- Reordered the image assertion to the Home & Kitchen/default view and explicitly selected Home & Living for pack-size assertions and multi-size interaction, restoring “For you” afterward so later tests retain their expected starting state. Test-only change; no storefront runtime changes.
- Additional deterministic test fix commit: `66eb5e75af90c411a59b25a060c248a8ea3e851a`. Awaiting a fresh Actions run.

- Follow-up run #284 (`43696393998`) exact log inspection: the mobile-shell test reported two assertions failing and then timed out trying to click the multi-size card's `[data-add]` button. The photo assertion incorrectly required `src` although below-the-fold product cards intentionally use `data-src` until the lazy-image observer loads them. The category test switched chips without waiting for the category refresh to complete, and the later click repeated the same race after browser-history navigation.
- Corrected the image assertion to accept the intended lazy `data-src` or loaded `src`. Category-scoped pack-size and add-button checks now trigger the chip selection, wait for the visible Home & Living heading and for the actual card/button, and include useful failure context. This is test-only; no storefront production code changed.
- Latest test correction commit: `045ef7b614e604b01ea892b56bd3a8c4b07e0f50`. Fresh Actions run required.
- PR #766 cannot be updated because it was merged on 2026-11-15 at `08:45:11Z` (merge commit `c943f91e5f5fa29740ef323d20df95f13ec6072e`). PR #769 is the only open PR and carries the validation-only follow-up against current `main`; keep it open until green, then it can be merged/closed as the sole follow-up. Batch 3 remains blocked.

## Mobile-shell CI regression correction — 2026-11-15 (follow-up PR #769)
- Re-inspected the exact failed `validate` job logs for run #286 (`43696563650`, job `132758315683`). The browser suite recorded failures for the lazy-loaded category drawer photo assertion, Back navigation after selecting a category, retry after simulated network failure, and garden-set pack-size/quick-buy tests. The final uncaught timeout was waiting for `#grid .card[data-id="garden-set"] [data-add]` in a fresh context whose default “For you” feed is paginated to 8 items.
- Corrected only the browser regression fixture/assertions:
  - Count a real drawer image whether it is already loaded in `src` or correctly deferred in `data-src`.
  - Assert Back restores the previously selected Home category URL (`/c/phones-accessories.html`) while returning to the Home view; same for Back from Cart.
  - Retry success checks the actual first page size (8+) rather than the obsolete 12+ assumption.
  - Explicitly select Home & Living before garden-set pack-size/quick-buy tests in fresh contexts; update product URL expectations to the selected category URL and back.
- This preserves the real product/category URL behaviour and the production lazy-image behaviour. No storefront runtime code, styles, cart, checkout, M-Pesa, or WhatsApp logic changed.
- Fix commits: `5b11473f586a0c0a2d5ec8c48a4ab294758baaa9` and `2b8d78b07944f2e96cb33b11fe59ae04516efa54`.
- Await the full PR #769 Actions quality gate before merge or Batch 3.

- Follow-up Actions run #291 (`43697107784`, job `132760027416`) passed all browser checks through retry loading and tab reload/SEO-head checks, then timed out at `shell.test.py:390` waiting for the Cart view after changing an existing cart pack size. This exposed a real navigation race in `updateCartLine()`: it called `closeTop()` and immediately `goTab('cart')`, initiating two competing browser-history traversals.
- Fixed the underlying mobile-shell behaviour in `mobile-shell/app.js`: cart pack edits now call `goTab('cart')` once, allowing its existing `closeAllThen` flow to close the product overlay and switch tabs in one history transition. This is a runtime bug fix, not a weakened assertion.
- Fix commit: `8cd9c1f6b4d049eb170df6c752a9d0249dbdb3a0`. Await the new full quality-gate run on PR #769; Batch 3 remains blocked.

## 2026-11-16 11:20 (Africa/Nairobi) — PR #784 pre-merge cleanups (branch `feat/kenya-programmatic-seo-foundation`)
- Done (Supabase, owner-approved): `products.meta_description` trimmed on 226 rows (leading/trailing whitespace only); verified 0 rows with line breaks, double spaces or edge whitespace; 1543 non-null, max length 155. Categories have no `meta_description` values.
- Done: `CLAUDE.md` documents the approved SEO columns and the `robots.txt` step in `product-pages.yml`.
- Next: wait for CI on the final commit, then merge PR #784, then open an isolated Security PR (`add_draft_product` anon/PUBLIC revoke; review `is_staff` and search paths). Not touching checkout/order/M-Pesa functions.

## 2026-11-16 12:00 (Africa/Nairobi) — PR #784 merged; Security PR opened (branch `security/revoke-add-draft-product-public`)
- Done: PR #784 merged to `main` (merge commit `b5364c7`) after CI run on `c872be7` passed.
- Done: isolated Security PR with `supabase/sql/security_revoke_add_draft_product_public.sql` (revoke execute on the seven-argument `add_draft_product` from PUBLIC, anon, authenticated) and `docs/security/security-definer-followup-2026-11-16.md`. NOT applied to the database.
- Next: owner reviews the PR; apply the SQL as a migration only after approval; then verify `proacl`. Do not touch checkout, order or M-Pesa functions.

## 2026-11-16 12:30 (Africa/Nairobi) — Security PR #793 applied+merged; #784 deploy checked; category SEO backfill drafted (not applied)
- Done: migration `revoke_add_draft_product_public_anon_authenticated` applied in Supabase; `add_draft_product` (7 args) ACL is now postgres + service_role only; check_voucher, track_order, recent_purchases, rate_order_*, is_staff unchanged. PR #793 merged (`ffc10f2`).
- Done: merge `b5364c7` of PR #784: Build product pages, Workflow guard, Daily SEO check, SEO auto index all succeeded; its own "pages build and deployment" was cancelled because newer commits superseded it; later deploy `9ecc4b9` (descendant) succeeded.
- Drafted, NOT applied: category `meta_title`/`meta_description` backfill for 66 active categories (script kept in the Claude session scratchpad, awaiting owner OK on examples).
- Finding: `merchant-feed.xml` already exists (1463 items = active products; 80 inactive drafts excluded). Gaps: no `g:google_product_category`, no `g:shipping`, no gtin/mpn (identifier_exists=no).
- Next: owner approves category examples -> apply -> rebuild product pages (`gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`).
