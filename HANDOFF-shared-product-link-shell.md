# HANDOFF - Shared product links open the shell product view (2026-11-08, branch `wip-shared-product-link-shell`, NOT merged)

## Why
Owner (2026-11-08, with two phone screenshots): a product link sent to someone opened the static `/p/<slug>.html` page ("Price of ... by size" table, shell top bar + bottom nav). They want the shell's own product view (photo, price, Pack size chips, Quantity, Add to cart, Buy now) to prevail for links they send.
Cause: the shell set its address bar and its Share button to the plain `/p/<slug>.html`, and that address is (rightly) not redirected for anyone (HANDOFF-stop-shell-redirect.md).

## Done (on the branch)
- [x] `mobile-shell/app.js` (commit 0261b35): `productUrl()` now returns `/p/<slug>.html?shell=1` (+ `#<size slug>` for a non-default size); the product page Share button shares `location.origin + productUrl()`. Diff is 8 additions / 6 deletions (2 comments + 2 code lines).
- [x] `shell-chrome.js` (commit 12c95f9): on `/p/<slug>.html` with `?shell=1`, runs `location.replace('/?product=<slug or #size slug>')`. 12 added lines, nothing removed. Undo = delete that first try block.
- Plain `/p/<slug>.html` (Google, old links, anything without `?shell=1`) is NOT redirected, for anyone. The generated pages keep their clean canonical, so `?shell=1` URLs are duplicates of the same page for Google. WhatsApp and Facebook read the page head (no scripts), so the link still previews as the product.
- `index.html` was NOT touched (no `?v=` bump): `sw.js` fetches `.js` network-first with revalidation, and the bot rewrites the seo-links block in `index.html`, so editing it on a branch risks a merge conflict. Bump `?v=17` to `18` after merging if a phone still shows the old behaviour.

## Not done / Left
- [ ] Nothing was run or loaded in a browser. Run `python3 mobile-shell/shell.test.py` and `node mobile-shell/navigation.test.mjs`; any check that expects the product address to be exactly `/p/<slug>.html` now has to expect `/p/<slug>.html?shell=1`.
- [ ] Phone test (private tab): open a product in the shell, tap Share (or copy the address bar), open that link in a second tab: it should land on the shell product view. Then open a plain `/p/<slug>.html` link: it should stay on the static page.
- [ ] Links already sent (plain `/p/...`) still open the static page. Making ALL phone visitors go to the shell would bring back the redirect that was removed on 2026-11-03 over the ranking-drop worry. Owner decision.

## Merge
Open the pull request from branch `wip-shared-product-link-shell` into `main` and merge it yourself when the tests pass.
