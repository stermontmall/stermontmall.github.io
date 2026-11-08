# WhatsApp button on the shell product page (2026-11-08)

Problem: on the mobile shell (`/`, `index.html`) the floating WhatsApp button (`#wa-float`, from `wa-float.js`) is hidden whenever an overlay is open
(`body.no-scroll #wa-float{display:none}` in `index.html`, added because it covered Buy now). The product page (`#page-product`) is an overlay,
so once a product was opened there was no WhatsApp contact.

Fix (branch `wip-whatsapp-product-page`, file `wa-float.js` only): a block at the end of the file adds, INSIDE `#page-product`,
1. a green WhatsApp icon link `#pp-wa-top` in the top bar, before the cart icon;
2. a full-width green button `#pp-wa-btn` ("Ask about this product on WhatsApp") above Product details.
Both link to `https://wa.me/254748888230?text=...` with the product name, chosen pack size (when there are several), price and the product address.
The href is refreshed by a MutationObserver (product / size change) and again on tap. No change to `mobile-shell/app.js` or `tailwind.css`, so no `?v=` bump.

Not done / to verify (sandbox could not clone or run tests):
- `python3 mobile-shell/shell.test.py` and `node mobile-shell/navigation.test.mjs`
- On a phone: open a product, check the icon and the button appear, tap each, change pack size and tap again (message shows the new size).
- If `sw.js` or the browser caches `wa-float.js`, a hard refresh may be needed to see it.

Undo: delete the block marked 2026-11-08 at the end of `wa-float.js`.
