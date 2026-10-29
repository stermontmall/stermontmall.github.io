# HANDOFF: shareable-product-links

Branch: `wip-shareable-product-links` (never merge to `main` until the task is finished and tested)

## Problem
Product links look like `https://stermontarcade.co.ke/#p-<product-id>`.
Google ignores everything after `#`, so these links only ever point at the homepage.
The real, indexable product pages are `/p/<product-id>.html` (they are already in `sitemap-products.xml`).

## Where the `#p-` links come from
- `storefront-live.js`: WhatsApp enquiry message used `location.origin + '/#p-' + p.id` (FIXED in step 1)
- `storefront-live.js`: opening the product popup calls `history.pushState(..., '#p-' + p.id)` (kept, see decisions)
- `kili-pages.js`: "Add to cart" button on /p/ pages links to `/#p-<id>` (intentional, opens the popup)
- `recent-orders.js`: fallback links to `/#p-<id>` (intentional, opens the popup)
- `tools/build_product_pages.py`: order link `index.html#p-<id>` (intentional)

## Done
- [x] Investigated; branch created
- [x] Confirmed Supabase data: no null, duplicate or badly formatted slugs; `products.slug` column is not used by the site
- [x] Step 1 (commit e2deb6e): `storefront-live.js` WhatsApp "Link:" now sends `https://stermontarcade.co.ke/p/<id>.html`. File grew by 137 bytes (one changed line + one comment), nothing else touched.

## Left (small steps, one push each)
- [ ] Step 2: fix Pentagon product id (`pentagon-50ec-insecticide-1-litre-stermont-arcade-kenya-1-litre` -> `pentagon-50ec-insecticide-1-litre`). Needs DB migration (FKs in stock_restocks, sales_ledger, loss_logs; check orders.items JSON), page rename in `/p/`, sitemap + merchant-feed update, and a redirect page at the old URL. Needs owner approval before touching the live DB.
- [ ] Step 3: remove or redirect 3 orphan pages with no product in the DB: `jembe-star-500-sl-herbicide-1-litre`, `kingcode-elite-50-ec-insecticide-1-litre`, `zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre-2`
- [ ] Step 4: test on a preview (open a product, tap "Ask on WhatsApp", check the link in the message opens the product page), then merge to `main`

## Decisions
- Keep old `#p-` links working (the load handler at the end of `storefront-live.js` still opens the popup), so links already shared do not break.
- Do NOT change the address bar to `/p/...` via pushState without testing: if the popup is closed with the URL left on `/p/`, relative links on the homepage (e.g. `account.html`) would resolve to `/p/account.html` and 404.
- Nothing is merged to `main` yet. Testing needs a browser/preview, which was not available in this session.
