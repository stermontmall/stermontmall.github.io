# HANDOFF - product SEO names and titles (2026-11-01)

## Done in Supabase (project oewvtbnmyombbtggamor)
- Applied the SEO plan to all 140 planned products: `products.name`, `products.seo_name`, `products.seo_title` now equal the plan in `seo_title_plan_v2_20261101` (`new_name`, `new_name`, `new_title`).
- Names are stored WITHOUT "Buy". The builder adds the visible "Buy" (`buyName()` in seo-meta.mjs, owner request 2026-10-30). Storing "Buy" would break pdpH1 (it would produce "Buy Original Powerful Buy ..."), the Merchant Center feed and the cart/order text.
- Titles are `{name} - Price in Kenya` (107 products) or `{name} - Kenya` (33 products, where the full form passes 60 characters). All titles are 60 characters or less and none start with "Buy" (matches buy-name.test.mjs).
- Fixes vs the old plan: promo lead words removed (Top-Quality, Professional, Powerful, ...), dropped words restored (Sprayer, Electric, model numbers, colours), Pentagon 50EC no longer has a price in its name, and the one stored "Buy Zagro Ultraxide ..." name/title was cleaned.
- `seo_title_plan_20261030.done` set to true for all rows.

## Backups / rollback
- `products_seo_backup_20261101` has the previous name, seo_name and seo_title for the 140 products. To roll back: update products from it by id.
- Older backups (2026-10-29/30) are still in place.

## Still to do
- Rebuild the product pages so the new names and titles show (generate-products.mjs, then seo-titles.mjs applies seo_title).
- Check a few rebuilt pages: H1 shows "Buy" once, the title has no "Buy".
- `product_slug_redirects` is empty. Slugs were NOT changed in this step.
- 3 of the 20 staged descriptions (`desc_stage_20261030`) are still not applied.
