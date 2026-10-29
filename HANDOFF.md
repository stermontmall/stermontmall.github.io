# HANDOFF: shareable-product-links

Branch: `wip-shareable-product-links` (never merge to `main` until the task is finished and tested)

## Goal
Straight product links like masterpiecefumigationservices.co.ke/product/roachgon-cockroach-gel/
instead of `https://stermontarcade.co.ke/#p-<product-id>`, for ALL products (not only Pentagon).
Google ignores everything after `#`, so hash links only ever point at the homepage.
The real, indexable product pages are `/p/<product-id>.html` (already in `sitemap-products.xml`).

## KEY DECISION (changed from the first plan)
Do NOT rename product ids. Use the existing, unused `products.slug` column as the URL name instead.
- Why: `id` is the primary key used by carts, orders, restock/sales/loss tables and wishlists. Renaming it on a live shop is risky and can break past orders.
- `products.slug` is not read anywhere in the site code (checked: only category slugs are used), so filling it is safe.
- Result: `id` stays as is (cart, orders, DB unchanged); the page URL becomes `/p/<slug>.html`.

## Done
- [x] Investigated; branch created
- [x] Step 1 (e2deb6e): WhatsApp enquiry "Link:" sends `/p/<id>.html` (all products)
- [x] Step 2 (f49654c), `storefront-live.js` (all products): popup puts `/p/<id>.html` in the address bar, pack-size switch updates URL, Back/Cart restore homepage URL, old `#p-<id>` links still work
- [x] Audit (read-only SQL): 226 active products, 33 ids have junk tails, ~190 are fine
- [x] Step 3a: DATABASE (live, already applied, migration `products_slug_clean_batch1`):
  - Backup table `public.products_slug_backup_20261029` (259 rows) holds the old slug values (restore with `update products p set slug=b.slug from products_slug_backup_20261029 b where b.id=p.id`)
  - `products.slug` set to `id` for all products (so existing pages stay valid)
  - Batch 1 slugs set for 10 products (ids unchanged). Verified: 259 rows, 10 renamed, 0 duplicate slugs.

### Batch 1 mapping (id -> new slug)
| old id (current page) | new slug |
|---|---|
| pentagon-50ec-insecticide-1-litre-stermont-arcade-kenya-1-litre | pentagon-50ec-insecticide-1-litre |
| shan-yes-men-s-navy-blue-tracksuit-set-set | shan-yes-mens-navy-blue-tracksuit-set |
| shan-yes-men-s-white-black-tracksuit-set-set | shan-yes-mens-white-black-tracksuit-set |
| ramtons-steam-iron-with-vertical-and-variable-steam-steam-iron | ramtons-steam-iron-with-vertical-and-variable-steam |
| samsung-galaxy-a06-4gb-ram-plus-64gb-4gb-plus-64gb | samsung-galaxy-a06-4gb-ram-64gb |
| tecno-spark-go-3-4gb-ram-plus-64gb-4gb-plus-64gb | tecno-spark-go-3-4gb-ram-64gb |
| xiaomi-poco-c71-3gb-ram-plus-64gb-3gb-plus-64gb | xiaomi-poco-c71-3gb-ram-64gb |
| xiaomi-redmi-15c-8gb-ram-plus-256gb-8gb-plus-256gb | xiaomi-redmi-15c-8gb-ram-256gb |
| familly-insect-killer-super-strength-aerosol-spray-aerosol-can | familly-insect-killer-super-strength-aerosol-spray |
| bedlam-200sl-insecticide-50-ml-2 | bedlam-200sl-insecticide-50-ml |

- [x] Step 3b-prep (3aaca0e): `kili-pages.js` understands clean-slug pages (reads real product id from `<meta name="stm-id">`, maps slug->id for card badges, search links use slug)
- [x] Step 3b (Pentagon, a90a9e2 + all 9 others, this push): all 10 batch-1 pages exist as `/p/<new-slug>.html` (canonical, og:url, JSON-LD, WhatsApp links use the new URL; `<meta name="stm-id">` keeps the real product id); each old `/p/<old-id>.html` is now a redirect stub (meta refresh + JS replace, keeps ?query and #hash). Made with a one-off script (URL contexts only).

## Left (small steps, one push each)
- [x] Step 3c (this push): `storefront-live.js` selects `slug` (falls back to the old column lists), popup address bar + WhatsApp link use `/p/<slug>.html` (id fallback); old `#p-<id>` and `#p-<slug>` links both open the popup.
- [x] Step 3d: nothing to hand-edit: `generate-products.mjs` rebuilds `sitemap-products.xml`, `merchant-feed.xml`, category pages and home lists with slug URLs on its first run after merge (merge touches generate-products.mjs, so the workflow runs automatically). `sitemap-images.xml` is built by `seo-extras.mjs` from the p/ files. `node seo-check.mjs`: 0 broken links.
- [x] Generator (this push): `generate-products.mjs` (run every 3h by `.github/workflows/product-pages.yml`, it WIPES and rebuilds `p/` and `c/`) now reads `products.slug`: pages, cards, category/home lists, sitemap and merchant feed use `/p/<slug>.html`; each page carries `<meta name="stm-id">`; the old id URL of a renamed product is regenerated as a redirect. A slug is ignored (id kept) if it is not URL-safe or clashes with another id/slug. Tested locally on a fixture (renamed product, variant group, clash). `tools/build_product_pages.py` is the old builder (not in the workflow).
- [ ] Batch 2 and 3: remaining 23 products with junk tails (same method: slug column + pages + redirects)
- [ ] 3 orphan pages with no product in the DB: `jembe-star-500-sl-herbicide-1-litre`, `kingcode-elite-50-ec-insecticide-1-litre`, `zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre-2` (remove or redirect)
- [ ] Optional: drop `.html` so URLs read `/p/<slug>/` like masterpiece (bigger job)
- [ ] TEST on a preview, then merge to `main`

## IMPORTANT ordering rule
The database is live, `main` is live. Nothing on `main` reads `slug` yet, so the DB change is invisible today. Do not merge 3c (code reads slug) unless the matching pages from 3b are in the same merge.

## Test checklist (needed before merge)
1. Open homepage, tap a product: address bar shows `/p/<slug>.html`, popup opens
2. Tap Back: popup closes, address bar is `/`
3. Open a product, tap Cart button: URL returns to `/`, then tap a nav link (e.g. Account): it must open `/account.html`, not `/p/account.html`
4. Open a product with pack sizes, switch size: URL changes to that size
5. Copy the address bar link, open it in a new tab: real product page loads
6. Open an old `/#p-<id>` link: popup opens and URL becomes the `/p/<slug>.html`
7. Tap "Ask about this item on WhatsApp": message contains `/p/<slug>.html`
8. Open an OLD page URL of a renamed product (e.g. the long Pentagon one): redirects to the new page
9. Add a renamed product to cart and place a test order: order saves, product id is the unchanged id

## Other decisions
- Kept `#p-` links working so already-shared links do not break.
- `kili-pages.js`, `recent-orders.js` and `tools/build_product_pages.py` still link to `/#p-<id>` on purpose (they need the popup); after the popup opens the URL becomes the straight `/p/` URL.
- Do NOT rename every id to a name-derived slug: existing short ids are nicer (e.g. `abasi-5-ec` vs `abasi-5-ec-1-litre`). Only fix the 33 junk ones.
- Nothing is merged to `main` yet. Testing needs a browser/preview, which was not available in this session.
