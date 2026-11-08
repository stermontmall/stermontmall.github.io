# HANDOFF - Previous / Next buttons + product count (branch wip-shell-pagination)

Owner request 2026-11-08: show Next and Previous buttons so more products are available, show more items, and show how many products the shop has.

## 2026-11-08 Africa/Nairobi - code written on this branch, NOT tested, NOT merged
What changed (mobile-shell/app.js, index.html `?v=17` -> `?v=18`):
- Home grid was infinite scroll (12 per load, no buttons). Now 24 products per page with **Previous** / **Next** buttons, "Page X of Y" and "Showing 1-24 of N products" under the grid. Changing category, search or filter goes back to page 1; pressing a button scrolls back to the top of the list.
- A line above the grid shows the product count for the current view ("N products in stock" on the full catalogue).
- A purple pill at the start of the pills row shows the live store-wide count ("N products in stock"), counted from the live database after load (sold-out products are not counted; pack sizes are folded into one product card).
- Infinite-scroll observer removed; the `#sentinel` element stays in index.html but is unused.

Not touched on purpose: generated static pages (`/c/*.html`, `/products.html`, `/guides/`), which are rebuilt by the generators. The footer line "View all 421 products" is written by the build bot (it counts every listing/pack size) and is a different number from the shell's card count.

Next (exact steps):
- [ ] Run the shell tests (cannot run in the chat sandbox): `python3 mobile-shell/shell.test.py` and `node mobile-shell/navigation.test.mjs`. `shell.test.py` may still expect infinite scroll and may need updating.
- [ ] Check on a phone: open the branch build, go to Home, press Next/Previous, change category and filters, open a product from page 2 and press Back.
- [ ] Decide which count to show: products (cards) or all pack sizes/listings.
- [ ] Merge to main only when tests are green.
