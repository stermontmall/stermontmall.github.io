# Agrovet product batch — 2026-11-18

## Final status
- 10 new products are created in Supabase and now set to `active=true` in the `Agrovet` category.
- All 10 are featured.
- All 10 have one image stored in the public `product-images` bucket.
- All 10 have stock set to 1,000 and low-stock alert set to 20.
- All 10 descriptions are 944–1,061 words, with Kenya-focused buying, handling, delivery and FAQ sections.
- All 10 have a unique meta title, meta description and image alt text.
- Pricing uses the saved rule: source retail reference less 15% for COGS, then 30% markup on COGS. The exact 30% markup is preserved without rounding.
- No pesticide or veterinary medicine products were included in this batch.

## Published products
| Product | Source retail (KES) | COGS (KES) | Store price (KES) | Image |
|---|---:|---:|---:|---|
| Almond Seedlings | 2,500.00 | 2,125.00 | 2,762.50 | Uploaded |
| Ashoka Tree Seedlings | 1,000.00 | 850.00 | 1,105.00 | Uploaded |
| Anvil Pruning Shear 8 Inch 300200 | 2,550.00 | 2,167.50 | 2,817.75 | Uploaded — illustrative comparable anvil shear |
| Grafted Blood Orange Seedlings | 500.00 | 425.00 | 552.50 | Uploaded |
| Certified Grafted Hass Avocado Seedlings | 250.00 | 212.50 | 276.25 | Uploaded |
| Chives Seedlings | 250.00 | 212.50 | 276.25 | Uploaded |
| Curry Leaf Seedlings | 1,500.00 | 1,275.00 | 1,657.50 | Uploaded |
| Custard Apple Seedlings | 350.00 | 297.50 | 386.75 | Uploaded |
| Thyme Seedlings | 200.00 | 170.00 | 221.00 | Uploaded |
| Fruit Tree Grafting Tool Kit | 3,150.00 | 2,677.50 | 3,480.75 | Uploaded |

## Product IDs
- `almond-seedlings`
- `ashoka-tree-seedlings`
- `anvil-pruning-shear-8-inch-300200`
- `grafted-blood-orange-seedlings`
- `certified-grafted-hass-avocado-seedlings`
- `chives-seedlings`
- `curry-leaf-seedlings`
- `custard-apple-seedlings`
- `thyme-seedlings`
- `fruit-tree-grafting-tool-kit`

## Image and validation notes
- All 10 image objects were confirmed in the public `product-images` bucket, with HTTP 200 storage metadata and file sizes above 15 KB.
- The seven formerly missing images were sourced and uploaded successfully. Almond, Ashoka, blood orange, chives, curry leaf and thyme images were added during continuation.
- The pruning shear photograph is a representative image of a comparable orange-handled anvil shear from The Olive Centre, not a verified photograph of the exact Epica Star 300200 unit. The product description and alt text explicitly disclose that it is illustrative and instruct buyers to confirm the exact model at dispatch.
- Storage metadata confirms MIME type and file size; image pixel dimensions were not independently verified from storage metadata.
- All 10 products were activated after each had an image. A database audit confirmed category = Agrovet, active = true, featured = true, one image each, stock = 1,000, low_at = 20, and exactly 30.00% markup on COGS.
- A crawler check of the expected static product URLs could not retrieve the site pages at the time of this handoff. Database publication is confirmed; public-page rendering / next scheduled static build still needs a browser-side check.

## Source references
- Primary Kenyan retail and product information: Farmers Trend Virtual Agrovet product listings.
- Almond photo: Bizim Bahce nursery listing.
- Ashoka photo: ShopTheWorld Ashoka sapling listing.
- Blood orange photo: Armazem do Verde grafted blood orange sapling listing.
- Chives photo: Coclicoh chive seedlings listing.
- Curry leaf photo: Evergreen Farm curry leaf plant listing.
- Thyme photo: Hillcrest Nursery thyme seedlings listing.
- Anvil shear illustrative photo: The Olive Centre Lowe 1 anvil pruner listing.
- Hass avocado, custard apple and grafting kit photos were uploaded in the first pass from the sources noted in the previous handoff.
