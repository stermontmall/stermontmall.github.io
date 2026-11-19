# SEO Handoff — PR #866

## What this PR delivers

- Replaces generic commercial buying-guide links with five Kenyan pest-control commercial guides:
  1. Best Termite Control Chemicals in Kenya
  2. Best Insect Killer Machines for Hotels in Kenya
  3. Rentokil Lumnia Compact Glueboard pricing and compatible replacement guidance in Kenya
  4. Best Bed Bug Treatment in Nairobi
  5. Pest Control Chemicals Prices in Kenya (2026)
- Keeps the five guides discoverable from the guides hub and included in `sitemap.xml`, while removing the former generic guide references.
- Improves generated category pages with substantial buying-introduction content, working product-name search, maximum-price filtering in KES, and price sorting.
- Adds exactly four FAQ accordions per generated category page, with matching FAQPage structured data generated from the same FAQ content.

## Pricing logic preservation

The existing `generate-products.mjs` KES pricing implementation and one-year `priceValidUntil` logic were preserved. The category-filter changes do not alter the product offer currency, offer price, or one-year validity-date calculation.

## Next steps after merge

1. Merge PR #866 into `main` after its complete validation check is green.
2. Submit the site's `sitemap.xml` in Google Search Console and monitor sitemap processing and indexing coverage.
3. Start Batch 3: build high-intent Nairobi and county-level local service pages, then continue reviewing and updating the remaining catalogue pricing for the Kenyan market.


## Remaining catalogue pricing template — 2026-11-18

- Exported 1,378 active catalogue products after excluding the 205 existing-product price updates and 25 new pack variants in the initial pricing batch, plus products explicitly marked `excluded_syngenta`.
- Product_ID uses the catalogue product ID. SKU is blank because the live products table has no SKU field. Pack_Size uses the product variant label where present, otherwise the catalogue unit.
- Current_Website_Price_KES is the current active catalogue price. Supplier_Wholesale_Price_KES and Calculated_New_Price_KES are intentionally blank because no verified Kenyan supplier quotes are recorded for these remaining products.
- No catalogue prices were changed or published by this export. This CSV is a review template only.
