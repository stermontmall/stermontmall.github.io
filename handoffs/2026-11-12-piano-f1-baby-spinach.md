# Piano F1 Baby Spinach — 12 November 2026

## Product work completed
- Checked the existing catalogue: `piano-f1-baby-spinach-seeds-5g` already exists and remains active at KSh 150, cost KSh 112.
- Created `piano-f1-baby-spinach-seeds-50g` in category 41 (Seeds & Seedlings), with source reference price/cost KSh 468 from Tropika's Piano F1 50g option and owner-set selling price KSh 699.
- Set stock 1000, low-stock alert 20, featured false, unit `50g pack`, variant group `piano-f1-baby-spinach-seeds`, variant label `50g`, SEO title `Piano F1 Baby Spinach Seeds 50g Kenya`.
- Existing 5g product was linked into the same variant group with label `5g`; its price, stock and image were unchanged.
- Description is SKU-specific and uses verified Royal Seed facts: dark-green smooth flat leaves, long stems, medium vigour, downy-mildew tolerance, and approximately 40 days from transplanting.

## Publication blocker — not live
- Tried the owner-provided Agropests page as the image source: https://agropests.com/products/baby-spinach-piano-f1-50g
- `public.add_product_photo(..., activate=true)` request 1879 returned HTTP 422: the page did not expose a usable product image to the uploader.
- Tried the Tropika product page as an image source in request 1880; no successful HTTP response or stored image could be verified.
- Searched for an exact Royal Seed Piano F1 50g packet image. Search results surfaced an Unwins-branded Piano F1 packet, which was rejected as a brand/pack mismatch. Royal Seed's official catalogue confirms the variety and pack sizes but does not provide a clear standalone 50g packet photo in the searchable material.
- Latest Supabase verification: 50g row remains `active=false`, `images=[]`, price KSh 699, cost KSh 468, stock 1000, low_at 20. The existing 5g row remains active with its original image.
- Do not activate or give it a live product link until a clear exact Royal Seed Piano F1 50g photo is obtained and verified in Storage.

## Pack-size research
- Royal Seed catalogue lists Piano F1 pack sizes: 5g, 10g, 25g, 50g, 100g, 250g and 500g.
- Tropika's Kenyan Piano F1 listing shows prices for 5g KSh 112, 10g KSh 169, 25g KSh 272, 50g KSh 468, 100g KSh 849 and 250g KSh 2,024. It does not show a 500g price in the available listing.
- Do not create/publish other pack-size rows until each pack's exact photo and current KES source price are verified. Existing 5g and new 50g form the initial variant family.

## Sources
- Owner's exact 50g product page: https://agropests.com/products/baby-spinach-piano-f1-50g
- Tropika size/price listing: https://tropika.co.ke/product/piano-f1-baby-spinach/
- Royal Seed official catalogue (pack sizes and agronomic description): https://royalseed.biz/ws/media-library/9995beed3b81cd56ed51c9ad574bc4d5/royal-seed--catalogue--25th-feb-2025.pdf
- Royal Seed official site: https://royalseed.biz/
- Unwins image deliberately rejected due different brand/packaging: https://unwins.co.uk/cdn/shop/products/spinachpianof1_unwins_30310674_a_0010_fop.jpg?v=1666552678
