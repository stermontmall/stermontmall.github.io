# HANDOFF: shareable-product-links

Branch: `wip-shareable-product-links` (never merge to `main` until the task is finished and tested)

## Goal
Straight product links like masterpiecefumigationservices.co.ke/product/roachgon-cockroach-gel/
instead of `https://stermontarcade.co.ke/#p-<product-id>`, for ALL products (not only Pentagon).
Google ignores everything after `#`, so hash links only ever point at the homepage.
The real, indexable product pages are `/p/<product-id>.html` (already in `sitemap-products.xml`).

## Done
- [x] Investigated; branch created
- [x] Supabase data checked: no null, duplicate or badly formatted slugs; `products.slug` column is not used by the site
- [x] Step 1 (e2deb6e): WhatsApp enquiry "Link:" sends `/p/<id>.html` (all products)
- [x] Step 2 (f49654c), `storefront-live.js` (all products):
  - Opening the product popup puts `/p/<id>.html` in the address bar (was `#p-<id>`)
  - Switching pack size updates the URL in place (replaceState)
  - Closing with Back returns to the homepage URL; closing via the Cart button restores the homepage URL (`BASE`) so relative links like `account.html` do not break
  - Old `#p-<id>` links still open the popup and then switch to the straight URL
  - Reloading a `/p/<id>.html` URL loads the real static product page
- [x] Audit (read-only SQL): 226 active products. Page URLs come from the product `id`. Most ids are already short and clean.

## Audit result: 33 product ids have junk tails (need renaming)
Pattern -> examples:
- repeated words: `...-set-set`, `...-steam-iron-steam-iron`, `...-3-piece-set` (habei-bear, smart-raha-life), `...-4gb-plus-64gb-4gb-plus-64gb` (samsung-galaxy-a06, tecno-spark-go-3, xiaomi-poco-c71, xiaomi-redmi-15c), `...-aerosol-spray-aerosol-can`
- leftover unit words: `...-1-unit`, `...-1-piece`, `...-blazer-piece`, `...-tracksuit-set`, `...-single-unit`
- inconsistent sizes: `...-1-litres`, `-5-litres`, `-5l`, `-1l` (absolute-375sc, agrixyl-407-5l, covver-xtra-500sc-1l, weed-out-480sl, digester-supper-69-ew, albafas-10 5-litres, jacto-hd-550, glamstar-20l, haier-90l, von-138l, hisense-ref205dr, kenwood-air-fryer)
- stray suffix: `bedlam-200sl-insecticide-50-ml-2`
- site name in the id: `pentagon-50ec-insecticide-1-litre-stermont-arcade-kenya-1-litre`
Full list: run `select id from products where active and id ~ '...'` (see git history of this file) or ask.
The other ~190 ids are fine and need no change.

## Left (small steps, one push each)
- [ ] Step 3: rename the 33 ids to clean slugs. For each: DB migration (update `products.id`; FKs in stock_restocks, sales_ledger, loss_logs; check orders.items JSON and wishlists in localStorage), rename page in `/p/`, update `sitemap-products.xml`, `merchant-feed.xml`, `sitemap-images.xml`, and leave a redirect page at the old URL. Needs owner approval before touching the live DB. Do in batches of ~10 with a DB backup table first.
- [ ] Step 4: remove or redirect 3 orphan pages with no product in the DB: `jembe-star-500-sl-herbicide-1-litre`, `kingcode-elite-50-ec-insecticide-1-litre`, `zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre-2`
- [ ] Step 5 (optional): drop `.html` so URLs read `/p/<id>/` like masterpiece (needs folder-per-product pages + redirects + sitemap change; bigger job)
- [ ] Step 6: TEST on a preview, then merge to `main`

## Test checklist (needed before merge)
1. Open homepage, tap a product: address bar shows `/p/<id>.html`, popup opens
2. Tap Back: popup closes, address bar is `/`
3. Open a product, tap Cart button: URL returns to `/`, then tap a nav link (e.g. Account): it must open `/account.html`, not `/p/account.html`
4. Open a product with pack sizes, switch size: URL changes to that size
5. Copy the address bar link, open it in a new tab: real product page loads
6. Open an old `/#p-<id>` link: popup opens and URL becomes `/p/<id>.html`
7. Tap "Ask about this item on WhatsApp": message contains `/p/<id>.html`

## Decisions
- Straight URL is the existing static page `/p/<id>.html` (already indexed via sitemap, already has canonical + schema).
- Kept `#p-` links working so already-shared links do not break.
- `kili-pages.js` ("Add to cart" on /p/ pages), `recent-orders.js` and `tools/build_product_pages.py` still link to `/#p-<id>` on purpose (they need the popup); after the popup opens the URL becomes `/p/<id>.html`.
- Do NOT rename every id to a name-derived slug: the existing short ids are nicer than name-derived ones (e.g. `abasi-5-ec` vs `abasi-5-ec-1-litre`). Only fix the 33 junk ones.
- Nothing is merged to `main` yet. Testing needs a browser/preview, which was not available in this session.
