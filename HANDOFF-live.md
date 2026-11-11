# HANDOFF-live

## 2026-11-11 — 20-product batch completed

### Published products
- 20 new product rows are active in Supabase.
- All 20 have one verified image in the public `product-images` bucket and one corresponding URL in `products.images`.
- All 20 have `stock=1000`, `low_at=20`, `featured=false`.
- All 20 use the owner's batch-specific 30% markup: `price = round(cost * 1.30, 2)`.
- Source-cost total: KSh 114,659.00.
- Stored selling-price total: KSh 149,056.70.
- Markup difference: KSh 34,397.70 before operating costs, delivery, payment fees or tax.
- Four initial candidates whose image sources could not be fetched were left inactive, then deleted before final verification. Exactly 20 new rows remain for this batch.

### Published catalogue
| Product | Source cost (KSh) | Selling price (KSh) |
|---|---:|---:|
| Ariete Vintage 156 4-Slice Toaster – Green | 8,895 | 11,563.50 |
| Ariete 1973 Retro Party Waffle Maker – Red | 3,995 | 5,193.50 |
| VON VBP351NLW 350W Plastic Jar Blender | 3,495 | 4,543.50 |
| VON VSM211AX 2-Slice Sandwich Maker | 1,995 | 2,593.50 |
| VON VAF080DSTK 8L Slim Digital Air Fryer | 9,499 | 12,348.70 |
| VON VAF050DSTK 5L Slim Digital Air Fryer | 7,295 | 9,483.50 |
| VON VBP501NLB 500W Plastic Jar Blender | 4,495 | 5,843.50 |
| VON VMS-206DGK 20L Digital Solo Microwave – Sand Black | 7,995 | 10,393.50 |
| VON VPC613XMK 6L Electric Pressure Cooker – 1000W | 7,995 | 10,393.50 |
| VON VKDG156SMK 1.5L Digital Kettle – 1800W | 4,495 | 5,843.50 |
| VON VMS-206MMK 20L Solo Microwave – Black | 7,495 | 9,743.50 |
| VON VCT-220DBCX 2-Burner Gas Cooker – Stainless Steel | 4,495 | 5,843.50 |
| VON VADZ0002K Portable Water Dispenser | 850 | 1,105.00 |
| VON VFT-42246-DMK 42-Inch Tower Fan – Black | 9,995 | 12,993.50 |
| VON VGS161HSK 1600W Handheld Garment Steamer | 3,995 | 5,193.50 |
| VON VRC5716NMX 5L Rice Cooker – 650W | 3,995 | 5,193.50 |
| Ariete 1548 Vintage Hand Mixer 450W – Beige | 4,695 | 6,103.50 |
| Ariete 2878/04 Vintage Milk Frother 250ml – Green | 6,995 | 9,093.50 |
| Ariete 2904 Vintage Rice Cooker 1.8L – Green | 8,995 | 11,693.50 |
| Ariete 6235 2000W Ceramic Steam Iron – Purple | 2,995 | 3,893.50 |

### Price and photo source record
- Ariete 156 toaster price: https://www.hotpoint.co.ke/catalogue/ariete-vintage-4-slice-toaster-1600w-green/
- Ariete 1973 waffle maker price: https://hotpoint.co.ke/catalogue/ariete-waffle-maker-retro-party-700w-red_6209/
- VON VBP351NLW price: https://www.hotpoint.co.ke/catalogue/von-vbp351nlw-plastic-jar-blender-350w/
- VON VSM211AX price: https://www.hotpoint.co.ke/catalogue/von-vsm211ax-2-slice-sandwich-maker/
- VON VAF080DSTK price: https://patam.co.ke/shop/kitchen-commercial-equipment/air-fryers-deep-fryers/von-digital-air-fryer-8l-vaf080dstk-slim-design/
- VON VAF050DSTK price: https://www.jumia.co.ke/von-vaf050dstk-slim-airfryer-5l-black-1yr-wrty-325340314.html
- VON VBP501NLB price: https://von.co.ke/product/von-vbp501nlb-plastic-jar-blender-500w
- VON VMS-206DGK and VMS-206MMK prices: https://von.co.ke/
- VON VPC613XMK price: https://koollivingappliances.com/product-category/kitchen-small-home-appliances/small-cooking-appliances/pressure-cookers/
- VON VKDG156SMK price: https://www.hotpoint.co.ke/catalogue/von-vkdg156smk-digital-kettle-1-5l-1800w-black/
- VON VCT-220DBCX price: https://www.hotpoint.co.ke/offers/von-new-wave-of-living-smarter/
- VON VADZ0002K and VFT-42246-DMK prices: https://von.co.ke/
- VON VGS161HSK price: https://www.digitalstore.co.ke/products/von-vgs161hsk-1600w-handheld-garment-steamer-fast-efficient-fabric-steaming-for-home-use
- VON VRC5716NMX price: https://www.hotpoint.co.ke/catalogue/von-vrc5716nmx-rice-cooker-5l-650w-stainless-steel/
- Ariete 1548 hand mixer price: https://www.hotpoint.co.ke/catalogue/ariete-1548-vintage-hand-mixer-450w-beige/
- Ariete 2878/04 milk frother price: https://www.hotpoint.co.ke/catalogue/ariete-vintage-milk-frother-250ml-500w-green/
- Ariete 2904 rice cooker price: https://www.hotpoint.co.ke/catalogue/ariete-2904-vintage-rice-cooker-18l-650w/
- Ariete 6235 steam iron price: https://hotpoint.co.ke/catalogue/ariete-6235-steam-iron-ceramic-soleplate-2000w-purple_6205/

### Build and verification
- GitHub Actions run: https://github.com/stermontmall/stermontmall.github.io/actions/runs/43067013087
- Run 633, attempt 2: success.
- The first attempt exposed two pre-existing overlength SEO titles. Shortened only those two `seo_title` fields; did not change either product's price, stock, slug or canonical URL.
- The final run passed the active-catalogue audit, page generation, product-page guard and IndexNow step.
- Confirmed the generated product HTML files exist in the repository and all 20 new URLs are present in `sitemap-products.xml`.
- The `robots.txt` file references `sitemap-products.xml`.
- The web viewer could not independently fetch the custom-domain URLs during this check; GitHub build, repository files and sitemap entries were verified.

### Rule handling
- 30% markup was applied as a batch-specific owner override. Leave the global 15% default unchanged for future batches unless the owner changes it.
- Descriptions are concise and SKU-specific; do not pad them to satisfy the stale 600–900-word helper check.
- Keep the four deleted, failed-photo candidates out of the catalogue; do not recreate them without a verified image source.


## 2026-11-11 — Follow-up pest-control batch: blocked before insertion

### Status
- No products were created or activated in this follow-up batch.
- Duplicate check found several candidate non-chemical items already in the live catalogue, including door sweeps, universal fly-light glue monitors, UV replacement tubes, and multiple insect monitoring products. These must not be duplicated under new IDs.
- The currently confirmed Kenyan supplier pages for the door sweep and fly-glue board also correspond to products already represented in the catalogue; they do not establish 20 new distinct SKUs.
- Product photos remain mandatory. No new photo was uploaded or marked attached in this step.

### Publishing-rule conflict to resolve in implementation
- Owner's batch instruction in chat requests 30% markup; the database helper `public.add_draft_product` hardcodes 15%. Do not call it for this batch unless the 30% override is implemented without changing the global default.
- Existing playbook requires 600–900-word descriptions. Keep descriptions SKU-specific and do not pad with generic copy.

### Next
- Continue researching distinct, non-chemical and age-appropriate pest-exclusion / monitoring products only.
- For each candidate, require an exact current KES supplier price, a matching direct product photo, and a duplicate-free catalogue check before insertion.
- If fewer than 20 can be fully verified, publish only the verified eligible items and report the remainder as blocked; never fabricate products, costs or images.
