# HANDOFF - Mobile shell look on every static page (updated 2026-11-05, pushed straight to `main` at the owner's request)

## Why
Since 2026-11-03 (commit 4d808f6, see HANDOFF-stop-shell-redirect.md) visitors are NOT redirected from `/p/` and `/c/` pages into the JS shell (Google could read that as a sneaky redirect). Owner (2026-11-05): "I need mobile shell to dominate everything". Chosen approach: the static pages themselves get the shell top bar (back, search, cart) and bottom nav (Home, Categories, Deals, Cart, Account). Same page, same URL for everyone, no redirect, no cloaking. Do not bring the redirect back.

## Done (on `main`)
- [x] Homepage `index.html` is the shell for everyone (commit 8e60a35, "Keep storefront navigation inside the mobile shell by default").
- [x] `seo-shell-chrome.mjs` + `seo-shell-chrome.test.mjs`: adds the bars to `p/`, `c/`, `guides/` and `products.html`. It is run at the end of `seo-shell-redirect.mjs` (a step `product-pages.yml` already runs after every build), so no workflow edit was needed.
- [x] `shell-chrome.js` draws the bars. Info pages (about, contact, FAQ, terms, returns, track, shipping, privacy, account) and `/services/` already load it.
- [x] 2026-11-05, commit 6414c26: `wa-float.js` now also loads `/shell-chrome.js?v=2` on any page that loads `wa-float.js` (loaded by `analytics.js` and `img-protect.js`), which should cover `nairobi.html`, `bulk-quote.html`, blog pages and guides. Skipped on `/`, `index.html`, admin, classic, upload-photos, advert-poster, list-products. Idempotent (`window.__stmChrome`). Undo: delete the added block at the top of `wa-float.js`.

## NOT done
- [ ] `/pest-control/` (about 35 pages plus `locations/` and `blog/`), and probably `seo-agro/` and `seo-pest/` output: these pages load no scripts, so the `wa-float.js` loader does not reach them. Fix = add `<script src="/shell-chrome.js?v=2" defer></script>` before `</body>` in whatever generates them (look in `seo-pest/`), then rebuild; or push the tag into each file. (See the 2026-11-05 evening update below: a manual workflow already does this.)
- [ ] `seo-shell-chrome.mjs` cannot cover other folders by itself: the "Save changes" step of `.github/workflows/product-pages.yml` only does `git add -A p c guides sitemap-products.xml sitemap-state.json sitemap.xml products.html merchant-feed.xml product-names.json index.html`. Adding `pest-control` there (and a recursive run in `seo-shell-chrome.mjs`) needs an owner edit: the GitHub connector gets "Forbidden" on `.github/workflows/*`.
- [ ] Not run: `python3 mobile-shell/shell.test.py`, `node seo-shell-chrome.test.mjs`, and a full build. Nothing here was loaded in a browser.
- [ ] Phone check in a private tab (old cached copies may not show the bars yet): `/nairobi.html`, `/bulk-quote.html`, one `/blog/` page, one `/p/` page, one `/c/` page should show the white top bar and the bottom nav; the green sticky buy bar on `/p/` sits above the nav.
- [ ] Search Console (owner): watch Performance and Pages for `/p/` URLs over the next 1-2 weeks, as in HANDOFF-stop-shell-redirect.md.

## Supabase
Connected (one project, active). Nothing was changed there for this work.

## Update 2026-11-05 (later session, Claude via GitHub + Supabase connectors; nothing was run or loaded in a browser)
Rule unchanged: NO redirect from `/p/` or `/c/`, same page and URL for everyone and crawlers. Do not bring it back.

Found:
- [x] `.github/workflows/shell-chrome-all.yml` ("Shell look on static pages", manual only) already exists. It runs `seo-shell-chrome-all.mjs` and commits `pest-control`, `nairobi.html`, `bulk-quote.html`, `404.html`. This covers the main "NOT done" gap above once it is run. It does NOT `git add` `seo-agro/` or `seo-pest/` (not verified whether those folders hold published pages).

Changes made this session:
- [x] `seo-index-status.yml` (commit aff6970): removed the `workflow_run` trigger, so Google indexing status runs once a day only. It was running after every product rebuild and used up the Search Console URL Inspection quota (91 reports, latest said quota used up).
- [x] Blog writer unblocked: PR #241 merged, new draft PR #340 opened (awaiting owner review and merge).
- [x] PR #236 and #190 merged by the owner. PR #261 (product posting fix docs/admin card) and PR #158 (mobile shell regression tests with safe fixtures) were CLOSED UNMERGED at the owner's request (both had merge conflicts with `main`). Their branches still exist: `fix/product-posting-photo-price-stock-2026-11` and `fix/mobile-shell-safe-fixtures-20261101`. Reopen and rebase if wanted. The Supabase changes from #261 are already live.

Next, in order:
1. [ ] Owner: Actions -> "Shell look on static pages" -> Run workflow (once). Then check that `/pest-control/` pages show the top bar and bottom nav.
2. [ ] Run the tests in a clone: `python3 mobile-shell/shell.test.py` and `node seo-shell-chrome.test.mjs`. Fix any failing check (the "no redirect" checks are the important ones).
3. [ ] Phone check in a private tab (list in "NOT done" above).
4. [ ] `index.html` still sends desktop-width screens and old `/#p-...` links to `/classic.html` (`noindex`). Decide whether to keep it.
5. [ ] Owner: Search Console, watch Performance (clicks around 2026-10-30) and Pages ("Page with redirect", "Crawled - currently not indexed") for `/p/` URLs for 1-2 weeks. About 140 product titles were rewritten 2026-10-30 to 2026-11-01, a second possible cause of any ranking drop.
