# HANDOFF - Clean product links: no `?shell=1`, no static page flash (2026-11-08, branch `wip-clean-product-links`, NOT merged)

## Why
Owner: shared product links end in `?shell=1` (e.g. `/p/catchmaster-vector-uv-fly-light-trap-20261108.html?shell=1`). They want a clean link, they want it to open the shell product view straight away (no classic page first), and they do not want Google ranking to suffer.
Cause: `mobile-shell/app.js` `productUrl()` added `?shell=1` to the address bar and the Share link. The inline early redirect in `/p/` pages (`seo-shell-chrome.mjs`) only handled plain addresses on phone-width screens, so a `?shell=1` link was only redirected by the deferred `shell-chrome.js`, after the static page had painted.

## Done (on the branch)
- [x] `seo-shell-chrome.mjs` (commit a0e661b): the inline script at the top of `<head>` on `/p/` and `/c/` pages now ALSO redirects `?shell=1` addresses at any screen width (never crawlers/preview bots), so old links already sent open the shell with no static flash. `addChrome()` now REPLACES an older inline script on an already-built page (before, the marker stopped any update), so the next page rebuild refreshes every `/p/` and `/c/` page.
- [x] `mobile-shell/app.js` (commit 01658c4): `productUrl()` returns the plain `/p/<slug>.html` (+ `#<size slug>` for a non-default size). The address bar and the Share button now give the clean link, no query string. Only `productUrl()` and two comments changed (+239 bytes).
- [x] `seo-shell-chrome.test.mjs` (commit 5bb080b): checks the new inline script (knows `shell=1`, added once, idempotent, replaces an older copy).
- Nothing else touched: `shell-chrome.js` keeps its fallback blocks (plain-address redirect for phones, and the old `?shell=1` handler). Generated pages (`p/`, `c/`) NOT edited by hand.

## Ranking notes
- Google indexes the plain `/p/<slug>.html`; its canonical and og:url already point to that clean address, so `?shell=1` was never the indexed URL. Removing it only stops duplicates being crawled.
- Crawlers and link-preview bots are never redirected, so Google and WhatsApp previews still read the static page. Real phone visitors are sent to `/?product=<slug>`, where the shell rewrites the address bar to the clean `/p/<slug>.html`. This is the "shell dominant" behaviour the owner accepted on 2026-11-08 (see the comment block in `shell-chrome.js`); if Search Console shows a drop, delete that block and `EARLY` in `seo-shell-chrome.mjs`.
- Not done on purpose: a `/product/<slug>/` URL style. GitHub Pages cannot send 301 redirects, so renaming every indexed `/p/<slug>.html` would lose ranking. `/p/<slug>.html` IS the clean link.

## Not done / Left
- [ ] `mobile-shell/shell.test.py` still expects `.../p/home-1.html?shell=1` in the Share checks (2 checks: shared URL and copied URL). Change them to `.../p/home-1.html`, then run `python3 mobile-shell/shell.test.py` and `node mobile-shell/navigation.test.mjs` and `node seo-shell-chrome.test.mjs`. NOTHING WAS RUN here (no clone, no node).
- [ ] After merging: bump `?v=` for `mobile-shell/app.js` in `index.html` (was `?v=17`), then trigger the page rebuild: `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main` (never edit the workflow file).
- [ ] Phone check (private tab): open a product in the shell, tap Share, open the copied link in a second tab: it goes straight to the shell product view with no static page first, and the address bar shows `/p/<slug>.html` with no `?shell=1`. Open an old `?shell=1` link: same. Open the plain link in a desktop-width window: stays on the static page (desktop is not redirected).
- [ ] Desktop-width visitors who open the shell and reload now get the static page (before, `?shell=1` kept them in the shell). Accepted trade-off of the clean link.
- [ ] Search Console: URL Inspection on one `/p/` page should show the clean URL as Google-selected canonical.

## Merge
Open a pull request from `wip-clean-product-links` into `main` and merge it only after the tests above pass.
