# HANDOFF - WhatsApp buttons inside the mobile shell product view (2026-11-08, pushed to `main` at the owner's request)

## Why
Owner: "I don't have the WhatsApp button inside the mobile shell product description." The floating chat button (`wa-float.js`) is hidden while a product page is open (`body.no-scroll #wa-float{display:none}` in `index.html`, added because it covered Buy now), so the shell product view had no WhatsApp contact at all. The static /p/ pages already had one.

## Done
- `mobile-shell/pp-whatsapp.js` (commit a32fb6a) adds, from the page's own text (no dependence on `app.js` internals):
  1. a green "Ask about this item on WhatsApp" button at the top of Product details (`#page-product`),
  2. a round WhatsApp button beside Add to cart / Buy now in the bottom bar,
  3. an "Ask on WhatsApp" pill under the quick-buy sheet details (`#sheet-quickbuy`).
  The message has the product name, selected pack size, price and the shell link `https://stermontarcade.co.ke/?product=<slug>`; it updates when the pack size changes (MutationObserver). Number: 254748888230 (same as `wa-float.js`).
- `wa-float.js` (commit 24050f6): a new first block loads `pp-whatsapp.js` when the page has `#page-product` (the shell). `analytics.js` already loads `wa-float.js` on the shell, so `index.html` (rewritten by the bot) was NOT edited.

## Not done / Left
- [ ] Nothing was run in a browser. Phone check (private tab): open a product in the shell: green button above the description, round green button left of Add to cart; change the pack size and tap the button: the WhatsApp message shows the new size. Open quick buy: the pill shows under the details.
- [ ] `mobile-shell/shell.test.py` was not run; it may count buttons in the product page bottom bar.
- [ ] If a phone still shows no button, bump `?v=` for `/wa-float.js` in `analytics.js` (currently `?v=2`).

## To undo
Delete the first block of `wa-float.js` and `mobile-shell/pp-whatsapp.js`.
