# HANDOFF - Product links no longer show the shell Home first (2026-11-08, pushed to `main` at the owner's request)

## Why
Owner: "When I click link it takes me on mobile shell website home before heading to the product." `/?product=<slug>` loads the shell, `app.js` renders Home and the grid, and only opens the product page after the whole catalog (about 640 rows) has downloaded, so Home was visible for that time.

## Done (commit 0c1a7e1, `index.html` head only; `app.js` NOT changed, so no `?v=` bump)
- A style block + inline script, active ONLY when the address has `?product=`: the html element gets class `deep-open`, which hides the app bar, views, bottom nav and WhatsApp float (visibility) and shows a small purple spinner, and turns off sheet/scrim transitions so the product page appears at once instead of sliding in over Home.
- The class is removed two frames after `#page-product` gets `.open`, or when the error toast shows, or when the grid shows "Could not load products", or after 10 s at the latest, so a missing product or a network failure never leaves a blank screen.
- Closing the product page still returns to Home underneath (unchanged).

## Not done / Left
- [ ] Nothing was run in a browser. Phone check (private tab): open a plain product link: spinner, then the product page, no Home in between. Close it: Home appears. Try a bad slug (`/?product=nope`): after the catalog loads you see Home and the toast "That product is no longer available". Try with the network off: Home with the retry text within 10 s.
- [ ] Remaining wait is the catalog download. A faster option (not built): fetch only that product's rows first and open the page before the full catalog arrives; needs an `app.js` change.
- [ ] `/?cat=<slug>` links still show Home for a moment before filtering (not asked).

## To undo
Delete the `<style>` block and the `<script>` block that follow the `#p-` redirect script in the `<head>` of `index.html`.
