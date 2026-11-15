# HANDOFF: tapping a product opens the full product details at once

Owner request 2026-11-15: "when I click a product it opens by default the full product details without asking me to tap more description".

## Cause
In `mobile-shell/app.js`, tapping a product card called `openQuickBuy()`. That opens the small quick-buy sheet (`#sheet-quickbuy`); the full product page (`#page-product`, with every description section, specs, FAQs, related products) only opened after a second tap on "See full product details".

## Done (branch `wip-product-opens-full-details`)
1. Branch created from `main`.
2. `mobile-shell/app.js`: a card tap now calls new `openProductFromCard(id)` (same as `openDeepLink`: set `qb`, `renderQB()`, `openProductPage()`). The "+" button on a multi-size card still opens the size sheet (unchanged). `index.html`: `app.js?v=38` -> `?v=39`.
3. `mobile-shell/shell.test.py`: card taps now expect `#page-product.open` (not `#sheet-quickbuy.open`); the Buy-now flow and the address/size/Back checks follow. Multi-size "+" sheet checks are unchanged.

## NOT done yet
- Tests were NOT run (the chat session had no network or clone). Run:
  `pip install playwright && playwright install chromium && python3 mobile-shell/shell.test.py` and `node mobile-shell/navigation.test.mjs`
- Merge to `main` only after the tests pass (open PR: wip-product-opens-full-details -> main).
- After merge, check the live site on a phone (hard refresh): tapping a product opens the full page with all sections.

## Undo
Change the card click line in section 11 of `mobile-shell/app.js` back to `return openQuickBuy(el.dataset.id);` and bump `?v=` again.
