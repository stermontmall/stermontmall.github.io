# HANDOFF - Stop the /p/ and /c/ visitor redirect (2026-11-03, pushed straight to `main` at the owner's request: "Fix now directly")

## Why
Ranking drop suspected (cause not confirmed; Search Console not visible from here). The redirect sent every non-crawler visitor from `/p/<slug>.html` to `/?product=<slug>` (and `/c/<slug>.html` to `/?cat=<slug>`), the JavaScript shell, while Googlebot got the static page. That can look like a "sneaky redirect" and sent Google visitors to the slow shell (Lighthouse mobile 39/100 on 2026-10-26).

## Done
- [x] `seo-shell-redirect.mjs` now only REMOVES the old `<!--stm-shell-->` and `<!--stm-shell-cat-->` scripts (idempotent; redirect stubs untouched). Commit 4d808f6 on `main`. The file is in the watched paths of `product-pages.yml`, so the push started a rebuild (bot commit 1bf678c, 2026-11-03 19:29 UTC); the workflow step still runs after every build, so regenerated pages cannot get the redirect back. Checked: `p/abasi-5-ec.html` and `c/crop-insecticides.html` on `main` contain no redirect script.
- [x] `mobile-shell/shell.test.py` updated (commit b5a2b48): the "redirect:" and "category redirect:" checks now expect NO redirect (phone, Googlebot, WhatsApp, desktop and `?classic=1` all stay on the page), and new checks run `inject()` / `injectCat()` through node (strip old script, idempotent, meta-refresh stubs untouched). The shell's own `/?cat=` and `/?product=` address checks are kept. NOT RUN (no clone/node here): run `python3 mobile-shell/shell.test.py` once and fix any failing check.
- [x] Checked by finding: the hashed slugs from `products_slug_backup_20261029` never had pages (`p/portable-wireless-bluetooth-speaker-c8c13.html` and `p/abasi-5-ec-1abed.html` have no git history), so no stub pages are needed for the 2026-10-29 slug change. Product pages are named by product `id`.
- Pushed to `main` directly instead of a `wip-` branch, because the owner asked for it. Nothing was run here.

## Left
- [ ] Run `python3 mobile-shell/shell.test.py` in a clone (see above).
- [ ] Phone check: `/p/abasi-5-ec.html` and one `/c/` page stay on the page (private tab; old cached copies may still redirect until the phone refreshes).
- [ ] `index.html` still sends desktop-width screens and old `/#p-...` links to `/classic.html` (`noindex`); not changed.
- [ ] Owner: in Search Console watch Performance (clicks around 2026-10-30) and Pages ("Page with redirect", "Crawled - currently not indexed") for `/p/` URLs over the next 1-2 weeks. Roughly 140 product titles were also rewritten 2026-10-30 to 2026-11-01, a second possible cause.
- [ ] To undo: restore `seo-shell-redirect.mjs` from the commit before 4d808f6 and rebuild.
