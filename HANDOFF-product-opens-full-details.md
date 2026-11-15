# HANDOFF: tapping a product opens the full product details at once

Owner request 2026-11-15: "when I click a product it opens by default the full product details without asking me to tap more description".

## Cause
In `mobile-shell/app.js`, tapping a product card called `openQuickBuy()`. That opens the small quick-buy sheet (`#sheet-quickbuy`); the full product page (`#page-product`, with every description section, specs, FAQs, related products) only opened after a second tap on "See full product details".

## Plan (small steps, branch `wip-product-opens-full-details`)
1. [done] Branch created from `main`.
2. [in progress] `mobile-shell/app.js`: a card tap calls new `openProductFromCard(id)` = same as `openDeepLink`: set `qb`, `renderQB()`, `openProductPage()`. The "+" button on a multi-size card still opens the size sheet (unchanged). Bump `?v=` for `app.js` in `index.html` (38 -> 39).
3. [next] `mobile-shell/shell.test.py`: card taps now expect `#page-product.open` (not `#sheet-quickbuy.open`); address/back checks follow.
4. [next] Run tests (could not be run in the chat session, no network/clone): `pip install playwright && playwright install chromium && python3 mobile-shell/shell.test.py` and `node mobile-shell/navigation.test.mjs`.
5. [next] Merge to `main` only after the tests pass.

## Undo
Change the card click line in section 11 of `mobile-shell/app.js` back to `return openQuickBuy(el.dataset.id);`.
