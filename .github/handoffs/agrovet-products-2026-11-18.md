# Agrovet product batch — 2026-11-18

## Current status
- 10 new Agrovet product records created in Supabase.
- All 10 remain `active=false` (not published) pending verified product photographs.
- All 10 are featured, with stock set to 1,000 and low-stock alert set to 20.
- Product descriptions are over 900 words each and include Kenya-focused buying, handling, delivery and FAQ sections.
- Pricing uses the saved store rule: source retail reference less 15% for COGS, then 30% markup on COGS. Prices are not rounded, preserving the exact 30% markup.
- No pesticide or veterinary medicine products were included in this batch.

## Products created
| Product | Source retail (KES) | COGS (KES) | Store price (KES) | Image |
|---|---:|---:|---:|---|
| Almond Seedlings | 2,500.00 | 2,125.00 | 2,762.50 | Missing |
| Ashoka Tree Seedlings | 1,000.00 | 850.00 | 1,105.00 | Missing |
| Anvil Pruning Shear 8 Inch 300200 | 2,550.00 | 2,167.50 | 2,817.75 | Missing |
| Grafted Blood Orange Seedlings | 500.00 | 425.00 | 552.50 | Missing |
| Certified Grafted Hass Avocado Seedlings | 250.00 | 212.50 | 276.25 | Uploaded to product-images |
| Chives Seedlings | 250.00 | 212.50 | 276.25 | Missing |
| Curry Leaf Seedlings | 1,500.00 | 1,275.00 | 1,657.50 | Missing |
| Custard Apple Seedlings | 350.00 | 297.50 | 386.75 | Uploaded to product-images |
| Thyme Seedlings | 200.00 | 170.00 | 221.00 | Missing |
| Fruit Tree Grafting Tool Kit | 3,150.00 | 2,677.50 | 3,480.75 | Uploaded to product-images |

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

## Image upload notes
- Direct image extraction from the Farmers Trend source pages failed with HTTP 403 for all 10 initial uploads.
- Alternate exact-product supplier pages succeeded for Hass avocado (Chemsasa), Custard Apple (Fruit Africa Veriplant), and Fruit Tree Grafting Tool Kit (Symnet).
- The three uploaded image files are each larger than 15 KB and stored in the public `product-images` bucket.
- Image dimensions (minimum 500 × 500) have not been independently verified in this workflow. Therefore, none of the 10 products has been activated.
- Remaining work: obtain exact-product supplier/manufacturer images for the seven missing products, verify every image is at least 500 × 500 and over 15 KB, then activate all 10 and verify the live product pages.

## Source-price references
- Farmers Trend Virtual Agrovet product listings/pages were used as the primary Kenyan retail references.
- Alternative image sources: Chemsasa (Hass), Fruit Africa Veriplant (Custard Apple), Symnet Agro Solutions (Grafting Tool Kit).
