# HANDOFF: shareable + permanent product links

Branch: `wip-permanent-product-links` (previous: `wip-shareable-product-links`). Both are already contained in `main`.
Rule: only merge to `main` when finished and tested.

## Goal
Straight, indexable product links `/p/<slug>.html` instead of `/#p-<product-id>` (Google ignores everything after `#`), for ALL products, and links that never break when a product is renamed.

## Key decisions
- Do NOT rename product ids (primary key for carts, orders, restock/sales/loss, wishlists). Use the `products.slug` column as the URL name; `id` never changes.
- Only the 33 junk ids were considered for cleanup; 19 were renamed, the rest were left on purpose (ids are already readable and stay stable).
- Slug is created once for new products (`make_product_slug_v2`) and is NOT changed when the name is edited (trigger `trg_set_product_slug`). Manual slug changes are remembered in `product_slug_redirects` (trigger `trg_log_product_slug_change`) and the generator writes a redirect page for every old slug.
- Old `#p-<id>` and `#p-<slug>` links still open the popup, so already-shared links keep working.
- `kili-pages.js`, `recent-orders.js`, `tools/build_product_pages.py` still link to `/#p-<id>` on purpose (they need the popup).

## Done (all on `main`)
- [x] WhatsApp enquiry link and popup address bar use `/p/<slug>.html` (id fallback), pack-size switch updates URL, Back/Cart restore `/`
- [x] DB (live): slug column filled (= id by default), 19 products renamed (batch 1 + batch 2), backup table `products_slug_backup_20261029` (259 rows)
- [x] `generate-products.mjs` builds pages, category/home lists, sitemap and merchant feed from slug; old id URL of a renamed product becomes a redirect stub; orphan pages redirected
- [x] Permanent links: `product_slug_redirects` + triggers + generator redirects
- [x] Re-verified 2026-10-29 (read-only): 259 products, 0 empty slugs, 0 duplicate slugs, 0 slugs clashing with another id, 0 non-URL-safe slugs, both triggers present. On `main`: batch 2 page `/p/vision-plus-32-inch-...-bracket.html` exists with canonical/og/JSON-LD/WhatsApp on the new URL, the old id URL is a redirect stub, orphan `jembe-star-500-sl-...` redirects, `sitemap-products.xml` lists the slug URLs.

## Left
- [ ] MANUAL BROWSER TEST on the live site (never done: no browser in the sessions that built this). Checklist below.
- [ ] Optional: drop `.html` so URLs read `/p/<slug>/` (bigger job, not needed)

## Test checklist
1. Homepage, tap a product: address bar shows `/p/<slug>.html`, popup opens
2. Back: popup closes, address bar is `/`
3. Open a product, tap Cart: URL returns to `/`; then a nav link (e.g. Account) opens `/account.html`, not `/p/account.html`
4. Product with pack sizes, switch size: URL changes to that size
5. Copy the address bar link, open in a new tab: real product page loads
6. Old `/#p-<id>` link: popup opens and URL becomes `/p/<slug>.html`
7. "Ask about this item on WhatsApp": message contains `/p/<slug>.html`
8. Old page URL of a renamed product (e.g. long Pentagon id): redirects to the new page
9. Add a renamed product to cart, place a test order: saves with the unchanged product id

## Rollback
`update products p set slug=b.slug from products_slug_backup_20261029 b where b.id=p.id;`
To rename a link by hand: `update products set slug='new-name' where id='...'` (old link keeps working).

## Process note
Code was merged to `main` after code checks only (generator fixture test, node --check, seo-check 0 broken links), before the browser checklist above. Treat step "TEST" as still open.
