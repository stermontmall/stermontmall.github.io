# HANDOFF - Mobile shell look on every static page (updated 2026-11-05, pushed straight to `main` at the owner's request)

## Why
Since 2026-11-03 (commit 4d808f6, see HANDOFF-stop-shell-redirect.md) visitors are NOT redirected from `/p/` and `/c/` pages into the JS shell (Google could read that as a sneaky redirect). Owner (2026-11-05): "I need mobile shell to dominate everything". Chosen approach: the static pages themselves get the shell top bar (back, search, cart) and bottom nav (Home, Categories, Deals, Cart, Account). Same page, same URL for everyone, no redirect, no cloaking. Do not bring the redirect back.

## Done (on `main`)
- [x] Homepage `index.html` is the shell for everyone (commit 8e60a35, "Keep storefront navigation inside the mobile shell by default").
- [x] `seo-shell-chrome.mjs` + `seo-shell-chrome.test.mjs`: adds the bars to `p/`, `c/`, `guides/` and `products.html`. It is run at the end of `seo-shell-redirect.mjs` (a step `product-pages.yml` already runs after every build), so no workflow edit was needed.
- [x] `shell-chrome.js` draws the bars. Info pages (about, contact, FAQ, terms, returns, track, shipping, privacy, account) and `/services/` already load it.
- [x] 2026-11-05, commit 6414c26: `wa-float.js` now also loads `/shell-chrome.js?v=2` on any page that loads `wa-float.js` (loaded by `analytics.js` and `img-protect.js`), which should cover `nairobi.html`, `bulk-quote.html`, blog pages and guides. Skipped on `/`, `index.html`, admin, classic, upload-photos, advert-poster, list-products. Idempotent (`window.__stmChrome`). Undo: delete the added block at the top of `wa-float.js`.

## NOT done
- [ ] `/pest-control/` (about 35 pages plus `locations/` and `blog/`), and probably `seo-agro/` and `seo-pest/` output: these pages load no scripts, so the `wa-float.js` loader does not reach them. Fix = add `<script src="/shell-chrome.js?v=2" defer></script>` before `</body>` in whatever generates them (look in `seo-pest/`), then rebuild; or push the tag into each file.
- [ ] `seo-shell-chrome.mjs` cannot cover other folders by itself: the "Save changes" step of `.github/workflows/product-pages.yml` only does `git add -A p c guides sitemap-products.xml sitemap-state.json sitemap.xml products.html merchant-feed.xml product-names.json index.html`. Adding `pest-control` there (and a recursive run in `seo-shell-chrome.mjs`) needs an owner edit: the GitHub connector gets "Forbidden" on `.github/workflows/*`.
- [ ] Not run: `python3 mobile-shell/shell.test.py`, `node seo-shell-chrome.test.mjs`, and a full build. Nothing here was loaded in a browser.
- [ ] Phone check in a private tab (old cached copies may not show the bars yet): `/nairobi.html`, `/bulk-quote.html`, one `/blog/` page, one `/p/` page, one `/c/` page should show the white top bar and the bottom nav; the green sticky buy bar on `/p/` sits above the nav.
- [ ] Search Console (owner): watch Performance and Pages for `/p/` URLs over the next 1-2 weeks, as in HANDOFF-stop-shell-redirect.md.

## Supabase
Connected (one project, active). Nothing was changed there for this work.
