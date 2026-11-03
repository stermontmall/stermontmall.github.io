# HANDOFF - Stop the /p/ and /c/ visitor redirect (2026-11-03, pushed straight to `main` at the owner's request: "Fix now directly")

## Why
Ranking drop suspected (cause not confirmed; Search Console not visible from here). The redirect sent every non-crawler visitor from `/p/<slug>.html` to `/?product=<slug>` (and `/c/<slug>.html` to `/?cat=<slug>`), the JavaScript shell, while Googlebot got the static page. That can look like a "sneaky redirect" and sent Google visitors to the slow shell (Lighthouse mobile 39/100 on 2026-10-26).

## Done
- [x] `seo-shell-redirect.mjs` now only REMOVES the old `<!--stm-shell-->` and `<!--stm-shell-cat-->` scripts (idempotent; redirect stubs untouched). Commit 4d808f6 on `main`. The file is in the watched paths of `product-pages.yml`, so the push starts a rebuild; the workflow step still runs after every build, so regenerated pages cannot get the redirect back.
- [x] Checked by finding: the hashed slugs from `products_slug_backup_20261029` never had pages (`p/portable-wireless-bluetooth-speaker-c8c13.html` and `p/abasi-5-ec-1abed.html` have no git history), so no stub pages are needed for the 2026-10-29 slug change. Product pages are named by product `id`.
- NOT tested: no clone/node here. Pushed to `main` directly instead of a `wip-` branch, because the owner asked for it.

## Left
- [ ] After the workflow run finishes: open 2-3 pages on a phone (`/p/abasi-5-ec.html`, one `/c/` page) and confirm they stay on the page (no jump to `/?product=`). `grep -c "stm-shell" p/*.html c/*.html` should find nothing.
- [ ] `mobile-shell/shell.test.py` still has "redirect:" checks that expect the old redirect and will fail when run. Update or remove them before the next shell change (not run here).
- [ ] `index.html` still sends desktop-width screens and old `/#p-...` links to `/classic.html` (`noindex`); not changed.
- [ ] Owner: in Search Console watch Performance (clicks around 2026-10-30) and Pages ("Page with redirect", "Crawled - currently not indexed") for `/p/` URLs over the next 1-2 weeks. Roughly 140 product titles were also rewritten 2026-10-30 to 2026-11-01, a second possible cause.
- [ ] To undo: restore `seo-shell-redirect.mjs` from the commit before 4d808f6 and rebuild.
