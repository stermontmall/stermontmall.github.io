## 2026-11-12 15:15 (Africa/Nairobi) — Remove Daraja M-Pesa STK prompt (owner request, permanent)

### Why
- Owner test payment KSh 3,350 (order STM-7PHZRP, receipt UKCQ51SNJQ) was credited to "Daraja-Sandbox", not the business. The STK prompt must not be offered to customers.
- The callback also failed: phone check rejected it, then the `amount_mismatch` status violated `mpesa_payments_status_check`, so the row stayed pending.

### Done
- Branch `wip-remove-daraja-stk` created from main.
- Data backup: `public.mpesa_payments_backup_20261112` (6 rows). `mpesa_payments` itself is KEPT (the `orders_verify_payment` trigger reads it).
- Old code saved under `removed/daraja-20261112/`: repo copies of stk-push, stk-status, mpesa-callback, mpesa-mode, setup-daraja.sql, plus the DEPLOYED mpesa-callback v21 (it differed from the repo copy). mpesa-probe was already an empty 410 stub.
- Supabase functions stk-push (v22), stk-status (v19), mpesa-callback (v22), mpesa-mode (v8) redeployed as disabled stubs (410 / enabled:false). Live in Supabase already.
- `checkout-deferred.js`: removed `CFG.stk`, the mpesa-mode fetch, stkOn, stkPoll, stkPay, rStk and the prompt box. `stkFn` is KEPT because the Paystack card flow uses it. `checkout.html` now loads `checkout-deferred.js?v=3`.
- Repo `supabase/functions/*` files for those four functions replaced with the same stubs.
- Checks: `node --check checkout-deferred.js` OK; `node --test no-classic-hop.test.mjs not-found-fallback.test.mjs seo-shell-chrome.test.mjs` 3/3 pass; no remaining `stk-push|stk-status|mpesa-mode` references outside `removed/` and `supabase/`.

### In progress
- Merge `wip-remove-daraja-stk` to main, then confirm the live checkout shows no M-Pesa prompt.

### Next
- Add one line to HANDOFF.md after merge.
- Owner still to do: forward SMS to 456 and call Safaricom 100 for the KSh 3,350; secrets MPESA_* can be deleted in the Supabase dashboard (no tool here deletes secrets).
- `payments-in` (bank Paybill notifications) is NOT Daraja STK and is left untouched.

## 2026-11-12 — Pest-control batch progress update 2

### Published and verified: 13 of 50
The following new product rows are active in Supabase. Each has one uploaded product image, and the upload-photos endpoint returned HTTP 200 with `live:true`. Stock=1000 and low_at=20 for each. The 30% batch markup is applied through `add_draft_product(...,30)`, then the site's price rounding trigger rounds to the next supported price point.

| Product | Reference cost (KSh) | Stored selling price (KSh) |
|---|---:|---:|
| Total TSPLI20162 20V 16L Cordless Backpack Sprayer | 14,800 | 19,250 |
| Turbo TR20 20L 2-in-1 Manual and Battery Knapsack Sprayer | 7,800 | 10,150 |
| EMAS 16L Manual Knapsack Sprayer | 2,500 | 3,250 |
| Aico Japan AC767-4 25L 4-Stroke Petrol Knapsack Sprayer | 19,000 | 24,700 |
| Aico Japan AC840PS 8HP Petrol Trolley Sprayer with Hose Reel | 26,999 | 35,099 |
| SOLO Model 425 Professional 15L Piston Backpack Sprayer | 9,500 | 12,350 |
| Aico Japan AC1609 160L 8HP Petrol Trolley Sprayer | 69,995 | 90,999 |
| Aico Japan AC-8L 8L Shoulder Strap Manual Pressure Sprayer | 2,550 | 3,350 |
| Kato Germany KT767-4 25L 4-Stroke Petrol Knapsack Sprayer | 19,500 | 25,350 |
| Milano Italia ML767-4 25L 4-Stroke Petrol Knapsack Sprayer | 19,500 | 25,350 |
| Kzubr KBS-20L 20L Rechargeable Battery Knapsack Sprayer | 9,500 | 12,350 |
| Kenagro 20L Manual and Electric Battery Knapsack Sprayer | 7,450 | 9,699 |
| Uvuko UVBM20L 20L Dual Battery and Manual Knapsack Sprayer | 7,500 | 9,750 |

### Draft blocked by photo retrieval
- Aico Japan 60L 7.5HP Trolley Agricultural Sprayer: draft row with reference cost KSh 52,000, computed selling price KSh 67,600, stock 1000, low_at 20. Supplier page image download returned HTTP 404. It remains inactive and must not be treated as published.

### Pricing qualification
- Published supplier retail listings are being used as reference costs per the owner's latest instruction. They are not verified acquisition costs; the 30% is a markup over the published reference price, not guaranteed net profit.
- The site's product pages rebuild on the 30-minute schedule. Mobile-shell links use the product slug. The public web viewer could not independently fetch the shell URL; Supabase active state, image storage, and upload response are verified.

### Next
- Continue adding genuinely distinct products in Pest Control & Fumigation; run duplicate checks first and require a Kenyan KES price reference plus exact product photo before activation. Progress: 13 / 50 live, 1 draft blocked by photo.

## 2026-11-12 — Pest-control batch progress update

### Published and verified: 7 of 50
All seven rows below are active, each has one uploaded product image in the public `product-images` bucket, and the matching Storage object exists. All have stock 1000 and low_at 20. The 30% batch markup was passed as the seventh argument to `add_draft_product`; the site's price-rounding trigger rounds the computed selling price up to its supported price points.

| Product | Reference cost (KSh) | Stored selling price (KSh) |
|---|---:|---:|
| Total TSPLI20162 20V 16L Cordless Backpack Sprayer | 14,800 | 19,250 |
| Turbo TR20 20L 2-in-1 Manual and Battery Knapsack Sprayer | 7,800 | 10,150 |
| EMAS 16L Manual Knapsack Sprayer | 2,500 | 3,250 |
| Aico Japan AC767-4 25L 4-Stroke Petrol Knapsack Sprayer | 19,000 | 24,700 |
| Aico Japan AC840PS 8HP Petrol Trolley Sprayer with Hose Reel | 26,999 | 35,099 |
| SOLO Model 425 Professional 15L Piston Backpack Sprayer | 9,500 | 12,350 |
| Aico Japan AC1609 160L 8HP Petrol Trolley Sprayer | 69,995 | 90,999 |

### Draft blocked by photo retrieval
- Aico Japan 60L 7.5HP Trolley Agricultural Sprayer: draft row exists with reference cost KSh 52,000, computed selling price KSh 67,600, stock 1000, low_at 20. Photo extraction from the supplier product page returned HTTP 404, so it remains inactive and must not be linked as live. Next: find an exact direct product image and upload, then verify before activation.

### Pricing qualification
- Published retail prices are being used as the reference-cost basis per the owner's latest chat instruction. They are not verified acquisition costs, so the resulting 30% is a markup on the listed reference price, not guaranteed net profit.
- The product-pages workflow rebuilds static pages on its 30-minute schedule. Mobile-shell links use the product slug. The web viewer could not independently fetch the mobile-shell URL during this session; database publication and image storage are verified.

### Next
- Continue sourcing distinct products only; run duplicate checks before each insert. Require a current Kenyan KES reference listing and exact photo before publishing. Progress: 7 / 50 live, 1 draft blocked by photo.

## 2026-11-12 — Pest-control catalogue batch (30% markup)

### Done
- Checked GitHub `PUBLISHING.md` / `CLAUDE.md` and Supabase `site_playbook`, product helper, image uploader and publication trigger.
- Confirmed the batch-specific 30% override is supported by the 7-argument `public.add_draft_product(..., 30)`; global default left unchanged.
- Added and published 1 distinct product in category 31: **Total TSPLI20162 20V 16L Cordless Backpack Sprayer**.
- Supplier price reference: KSh 14,800, Power X Tools Kenya (listing says in stock): https://powerxtoolske.com/collections/sprayers/products/total-20v-16l-cordless-backpack-sprayer-tspli20162
- Stored reference cost KSh 14,800; raw 30% markup gives KSh 19,240; site's price-point rounding trigger stores KSh 19,250.
- Exact model photo uploaded from https://total-tools.by/image/cache/catalog/products/16/915240/55049568/55049569/hero-tspli20162-650x650.jpg to public bucket; uploader returned HTTP 200.
- Verified row active=true, images has the uploaded URL, storage object count=1, stock=1000, low_at=20, and SEO title is within 60 characters.
- Product mobile-shell link: https://stermontarcade.co.ke/?product=total-tspli20162-20v-16l-cordless-backpack-sprayer

### Pricing note
- Supplier page price is a published retail listing used as the requested reference-price basis, not the owner's actual wholesale acquisition cost. The resulting 30% is a markup over that reference listing, not verified net profit.

### In progress / next
- Continue researching distinct items, check duplicates in `public.products`, verify current in-stock KES price and exact model photo, then create with 30% batch markup and publish only after image verification.
- Current batch progress: 1 / 50 published.

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


## 2026-11-11 — New-catalogue pest-exclusion research

### Done
- Rechecked the live catalogue for mosquito net kits, insect-screen mesh, door seals/sweeps and insect sweep nets. The catalogue already has the Mosquito Window Net Kit and two door-sweep listings; do not duplicate those.
- Identified a potentially new local listing: Ragsons Insect Screen Mesh, 4 ft × 20 m, green, KES 3,694.59. Supplier page: https://www.ragsons.co.ke/shop/insect-screen-mesh-6966. Supplier's direct product image URL is exposed in the indexed page: https://www.ragsons.co.ke/web/image/product.template/6966/image_1920?unique=6e490f8. The supplier page could not be opened by the browser during this run, so image dimensions/visual match and current stock could not be independently checked.
- Identified a generic Sweep Net for Insect Collection at KES 618 from Generation Space: https://generationspace.co.ke/product/sweep-net/. The product page lists it in stock, but its image link resolves to a lazy-loading placeholder in the browser, not the product photograph. A second local listing at ScienceLab is KES 650: https://sciencelab.co.ke/products/sweep-net.
- Confirmed these are non-chemical physical screening / insect-monitoring items; excluded pesticide, insecticide, rodenticide and other hazardous chemical listings from this research.

### Blocked — not published
- No new row was inserted or activated. Neither candidate currently has an independently verified, accessible exact product image (minimum 450 × 450) that can be checked in Storage after upload.
- The live publishing helper still applies 15% markup. Owner's earlier batch-specific 30% request must be applied by a safe batch override, not by silently calling the helper and accepting 15%.
- Do not claim the above candidates are live. Do not use generic or mismatched photos.

### Next exact action
- Obtain a directly verifiable product photo for the Ragsons 4 ft × 20 m green insect mesh and/or the Generation Space sweep net; then insert only if the exact current KES source price and stock are confirmed, apply the batch-specific 30% markup, upload through public.add_product_photo, verify the Storage object and products.images, and only then activate.

## 2026-11-11 — Sweep net product published

### Published
- Product: Sweep Net for Insect Collection
- Product ID / slug: `sweep-net-for-insect-collection`
- Category: Pest Monitoring & Inspection Tools (category 91)
- Price source: Generation Space, KSh 618.00, listed in stock: https://generationspace.co.ke/product/sweep-net/
- Photo source: ScienceLab Sweep Net listing: https://sciencelab.co.ke/products/sweep-net/
- Photo uploaded to public Storage bucket as `product-images/sweep-net-for-insect-collection.webp`; Storage metadata reports image/webp, 28,634 bytes, HTTP status 200.
- `products.images` contains the public Storage URL.
- `active=true`, `stock=1000`, `low_at=20`, `featured=false`.
- Cost KSh 618.00; selling price KSh 803.40 (30% batch-specific markup). Global 15% default unchanged.
- Mobile-shell link: https://stermontarcade.co.ke/?product=sweep-net-for-insect-collection

### Notes
- No existing exact product name or ID was found before insertion.
- Description uses only supplier-confirmed details; handle variant, dimensions and weight remain unspecified and are flagged for supplier confirmation.
- The product is a non-chemical field-sampling tool, not a chemical pest treatment.
- The database row and Storage object are verified. The web fetch tool could not independently render the Storage URL, but Storage metadata confirms HTTP 200 and the image reference is present.
- Product-page workflow dispatch is still pending because no GitHub workflow-dispatch action is exposed in the connected toolset. Do not edit generated HTML or workflow files. Run the documented dispatch when an Actions-capable GitHub session is available:
  `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`


## 2026-11-11 — Continued non-chemical pest-exclusion research

### Done
- Rechecked the live catalogue for mosquito/insect mesh products. Existing mosquito window net kit is already active; do not duplicate it.
- Found a distinct candidate: Knicker Green Gauze Wire 3 ft × 25 m, listed in stock at KSh 1,885 by AHIHQ Traders (Nairobi): https://ahihqtraders.com/products/green-gauze-wire-3ft-25m-roll-wholesale. The supplier page describes a woven screen for windows, vents and doors that keeps mosquitoes and flies out while allowing airflow. Batch selling price at 30% markup would be KSh 2,450.50.
- A second candidate, Ragsons Insect Screen Mesh 4 ft × 20 m, lists KES 3,694.59 and a supplier image URL: https://www.ragsons.co.ke/shop/insect-screen-mesh-6966. The page lists colour variants but stock for the selected variant was not confirmed.
- Search-result image data showed a product image for Knicker green gauze wire, but no accessible direct image URL was exposed. Attempts to open supplier pages and the Ragsons direct image failed; the direct image download also failed.

### Blocked — not published
- No new row inserted or activated. Exact product photograph could not be downloaded and verified at 450×450 minimum, so publication requirement is not met.
- Do not substitute a generic mesh photo or use an unrelated image. Existing catalogue contains the Mosquito Window Net Kit, so that SKU is not a new candidate.
- No product page, sitemap or build changes were made in this step.

### Next
- Continue with distinct non-chemical physical exclusion or monitoring products only. Require exact current KES price, exact matching supplier/manufacturer photo, and duplicate-free catalogue check before insertion. Apply the user's batch-specific 30% markup, stock 1,000 and low_at 20 after all evidence is verified.


## 2026-11-11 — Owner authorised immediate publication of Knicker gauze wire

### Verified
- Supplier listing reports Knicker Green Gauze Wire, 3 ft × 25 m (code AHQT-A004-01) in stock at KSh 1,885: https://ahihqtraders.com/products/green-gauze-wire-3ft-25m-roll-wholesale
- Batch selling price at 30% markup: KSh 2,450.50.
- Catalogue check did not return an existing green gauze wire / Knicker listing. Relevant categories available: Pest Control & Fumigation (31) and Pest Monitoring & Inspection Tools (91); intended category is Pest Monitoring & Inspection Tools.

### Blocked — not inserted or published
- Supplier page exposes a product image description (“Roll of green gauze wire mesh”), but no direct, retrievable image URL or image bytes were available from the indexed page. Direct page fetch returned cache miss; exact-image search did not yield a downloadable asset.
- Per mandatory photo rule, do not create an active listing or claim publication without an exact verified image (minimum 450×450), uploaded to Storage, and referenced in products.images.
- Owner explicitly authorised immediate publication, but authorisation does not waive the exact-photo requirement. No product row was inserted, no image uploaded, and no activation performed.

### Next exact action
- Obtain the exact Knicker Green Gauze Wire product image from AHIHQ Traders (or another official supplier/manufacturer source) as a direct accessible image URL or upload. Then upload/verify Storage object and image array, insert with cost KSh 1,885, price KSh 2,450.50, stock 1,000, low_at 20, and activate. Do not substitute generic imagery.


## 2026-11-11 — Online image search for Knicker Green Gauze Wire

- Re-searched the exact Knicker product and AHIHQ collection. Supplier listing confirms KSh 1,885 and 3 ft × 25 m; the page only exposes the alt description “Roll of green gauze wire mesh” in indexed text, not a retrievable direct image URL.
- Found visually similar green gauze/screen rolls on Takealot and Auto Paints & Plates, but their visible labels/specifications are 900 mm × 30 m and/or MTS brand, not Knicker 3 ft × 25 m. Also found unrelated green PVC-coated welded mesh images. Rejected all as mismatched product photos; do not upload them for this SKU.
- Supplier page direct fetch/download failed. No exact image was retrieved, uploaded, or verified. Product remains unpublished; no database writes made.
- Next: request/obtain AHIHQ's own product image or use an exact Knicker 3 ft × 25 m image from its manufacturer/authorised distributor. Do not use a visually similar substitute as if it were the listed product.


## 2026-11-11 — Poultry equipment batch: two drafts created, image upload blocked

### Researched and inserted as inactive drafts
- WQ 3kg Poultry Feeder – Floor or Hanging. MyAgrovet source price KSh 600: https://myagrovet.com/product/premium-3kg-uv-resistant-poultry-feeder-dual-mount-system. Batch price at 30% markup: KSh 780. Draft ID: `wq-3kg-poultry-feeder-dual-mount`.
- 1.5kg Poultry Feeder with Anti-Scatter Ring. Ecochicks source price KSh 180: https://ecochickspoultry.com/shop/1-5kg-poultry-feeder-with-anti-scatter-ring/. Batch price at 30% markup: KSh 234. Draft ID: `1-5kg-poultry-feeder-anti-scatter-ring`.
- Both have stock=1000, low_at=20, featured=false, category_id=44, active=false.

### Blocked — not published
- Exact 512×512 product image results were found for both products on MyAgrovet, but the upload-photos endpoint rejected both image URLs with HTTP 422: “link is a web page, not a direct image file; use the direct image link or send image_base64”.
- No Storage object was created and both products.images arrays remain empty. Both rows remain inactive. Do not activate or report as published.
- Upload request 1481 failed for the WQ 3kg feeder; request 1482 failed for the 1.5kg anti-scatter feeder.
- Existing catalogue duplicate check returned no matching exact WQ 3kg or 1.5kg anti-scatter item.

### Next exact action
- Obtain accessible image bytes or a direct image URL that the upload endpoint can fetch for each exact product. Upload and verify Storage object + products.images, then activate only after verification. Continue the remaining batch only with distinct safe poultry/farm equipment; no chemicals or veterinary medicines.


## 2026-11-11 — Poultry feeder drafts activated after image-link upload fix

### Published in Supabase
- WQ 3kg Poultry Feeder – Floor or Hanging
  - ID/slug: `wq-3kg-poultry-feeder-dual-mount`
  - Source cost: KSh 600; selling price: KSh 780 (30% batch markup)
  - Public image: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/wq-3kg-poultry-feeder-dual-mount.webp
- 1.5kg Poultry Feeder with Anti-Scatter Ring
  - ID/slug: `1-5kg-poultry-feeder-anti-scatter-ring`
  - Source cost: KSh 180; selling price: KSh 234 (30% batch markup)
  - Public image: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/1-5kg-poultry-feeder-anti-scatter-ring.jpg
- Both product rows are now active=true, stock=1000, low_at=20, featured=false.
- Both image URLs are present in products.images. Storage metadata verifies public bucket objects: WQ image image/webp, 57,376 bytes, HTTP 200; 1.5kg feeder image image/jpeg, 43,123 bytes, HTTP 200.
- Catalogue check found no exact duplicate IDs/names before insertion.

### Remaining
- Product rows and image objects are verified in Supabase. GitHub product-page generation and sitemap refresh have not been dispatched or verified; no claim that generated static pages are updated.


## 2026-11-11 — Safe farm-protection catalogue continuation

### Scope
- Continue only with non-chemical crop protection, physical exclusion, nursery and irrigation supplies. Do not add or promote pesticides, herbicides, insecticides, rodenticides, toxic baits or other hazardous chemical products.
- Do not alter existing catalogue products.

### Research completed
- Reviewed the live product catalogue for duplicates. Existing products already include a crop-support net, mosquito window net kit, insect-monitoring traps, yellow sticky monitoring boards, sweep net, and several other pest-control listings; do not recreate these under new IDs.
- Found Kenyan supplier listings for agricultural insect netting, bird netting, shade nets, greenhouse materials and nursery supplies:
  - Afeef Maimun agricultural nets: https://afeefmaimun.com/c/agriculture/agricultural-nets/ (published specifications and prices; page fetch failed during verification).
  - Afeef Maimun agriculture catalogue: https://afeefmaimun.com/c/agriculture/
  - Hortitechno insect net page: https://hortitechnogreenhouses.com/product/insect-nets-kenya/; product photo URL exposed as https://hortitechnogreenhouses.com/wp-content/uploads/2021/04/net-600x629.jpg. Page specifies 40-mesh insect net in 2.5m x 50m and 3m x 50m sizes, but the page does not provide an exact price for either configuration.
  - Hortitechno seedling tray page: https://hortitechnogreenhouses.com/product/planting-trays-kenya/; direct photo https://hortitechnogreenhouses.com/wp-content/uploads/2021/04/tray-600x394.jpg. The page describes 50, 66, 78, 128, 200 and 288 cell variants, but the image height is below the 450px minimum.
  - Symnet 50-mesh insect net listing: https://www.symnet.co.ke/solutions/insect-nets; publishes prices for 3m x 50m and 5.5m x 50m rolls, but exact direct product photo verification is still outstanding.
  - Symnet shade net pricing: https://www.symnet.co.ke/solutions/agro-shade-nets; publishes several shade-net sizes and prices, but exact direct product photo verification is still outstanding.
- Web retrieval failed to fetch the candidate direct images during this pass. No new photo was uploaded or verified in Supabase Storage.

### Blocked — no products published in this continuation
- No new product row was inserted or activated. This is intentional: each product needs an exact current KES supplier price, a duplicate-free catalogue check, and a sharp exact product photo of at least 450 x 450 that can be uploaded and verified.
- The requested 600+ word descriptions must remain factual and SKU-specific. Do not pad with repetitive generic SEO copy when the source does not provide enough product detail.
- No product-page workflow was dispatched; no new static pages or sitemap entries are claimed.

### Next
- Continue only with safe non-chemical physical barriers and ordinary farm supplies.
- Publish only the individually verified items; if the evidence does not support 30 distinct SKUs, report the smaller verified count rather than inventing products, prices or photos.


## 2026-11-11 — UV-stabilised insect-exclusion net published

- Added and activated `uv-stabilised-hdpe-insect-net-3m-x-50m`.
- Supplier: Irri-hub, product page https://shop.irrihub.com/products/pro-insect-net; published KSh 15,000 for the 3m × 50m configuration.
- The 30% batch markup gives source cost KSh 15,000 and selling price KSh 19,500.
- Description records material, dimensions, coverage calculation and buyer checks without unsupported claims or repetitive SEO padding.
- Photo upload from the Symnet exact 50-mesh 3m × 50m product page succeeded (HTTP 200). Public Storage object: `product-images/uv-stabilised-hdpe-insect-net-3m-x-50m.jpg`, JPEG 39,669 bytes; `products.images` contains the public URL.
- Supabase row verified: active=true, stock=1000, low_at=20, featured=false, one image.
- First upload attempt from Irri-hub page returned HTTP 404; it was not attached. The successful image was sourced from Symnet's 50-mesh product page.
- Product page/sitemap generation has not yet been independently checked. The current site playbook says the automatic build runs every 30 minutes; verify generated page and sitemap after that window.

- Follow-up GitHub check after publication: generated page `p/uv-stabilised-hdpe-insect-net-3m-x-50m.html` is not present yet, and sitemap-products.xml does not yet include this slug. Recheck after the automatic 30-minute build window; do not claim the static page is generated until both are present.


## 2026-11-11 — Nursery tray and shade-net candidates held back

- Created draft catalogue rows for `uv-treated-seedling-propagation-tray` (source KSh 100, 30% markup KSh 130) and `50-uv-shade-net-4m-x-50m-roll` (source KSh 15,000, 30% markup KSh 19,500).
- Both supplier-page photo imports returned HTTP 200 and produced Storage objects, but both files have the same 1,255,029-byte size and identical ETag. That suggests the page importer may have captured a shared/default site image rather than distinct product-specific photos.
- To avoid publishing potentially misleading images, both rows were set to `active=false`. Their draft records and uploaded files remain for later photo replacement/verification.
- The insect-exclusion net published earlier remains separate and active.
- Static page/sitemap generation remains unverified; do not claim generated pages exist until checked.


## 2026-11-11 — Existing shade-net draft photo replaced and product activated

- Resumed the existing draft `50-uv-shade-net-4m-x-50m-roll`; no duplicate row was created.
- Supplier listing: Symnet Agro 50% UV Shade Net, 4m × 50m, KSh 15,000 per roll: https://www.symnet.co.ke/solutions/agro-shade-nets
- Replaced the prior suspect image using the supplier's shade-net product page via `public.add_product_photo(..., false, false)`. Upload request 1490 returned HTTP 200 and `{ok:true, live:false, photos:1}`.
- Verified Storage object `product-images/50-uv-shade-net-4m-x-50m-roll.webp`, image/webp, 66,170 bytes, HTTP 200. `products.images` now references the new public URL.
- Activated the existing row after image and row verification. Final row: active=true, cost KSh 15,000, selling price KSh 19,500 (30% batch markup), stock=1000, low_at=20, featured=false.
- Mobile-shell link: https://stermontarcade.co.ke/?product=50-uv-shade-net-4m-x-50m-roll
- Automatic static page/sitemap build is expected within 30 minutes; not yet independently checked.



## 2026-11-11 — Additional safe farm products published

- `5-kg-broiler-chicken-feeder`: Mkulima Jovial cost KSh 450, retail price KSh 585 (30% markup); photo import request 1491 HTTP 200; active=true; stock=1000; low_at=20.
- `uv-treated-bird-net-4m-x-50m-roll`: Symnet supplier cost KSh 12,500, selling KSh 16,250; photo import request 1493 HTTP 200; active=true; stock=1000; low_at=20. Supplier: https://www.symnet.co.ke/solutions/bird-nets.
- `6-litre-manual-chicken-drinker`: Mkulima Jovial cost KSh 450, selling KSh 585; request 1494 HTTP 200; active=true; stock=1000; low_at=20.
- `3-litre-manual-chicken-drinker`: Mkulima Jovial cost KSh 350, selling KSh 455; request 1495 HTTP 200; active=true; stock=1000; low_at=20.
- `24-hole-chicken-trough-feeder`: Mkulima Jovial cost KSh 250, selling KSh 325; request 1496 HTTP 200; active=true; stock=1000; low_at=20.
- Product rows and image URLs verified in Supabase; source price links and factual descriptions stored in each product record.
- `40-mesh-insect-net-2-5m-x-50m-roll` draft was created from Hortitechno KSh 100/m² (calculated KSh 12,500 for 2.5m×50m), but photo import request 1492 failed HTTP 422 (network timeout). Remains inactive; not reported live.
- `200-micron-uv-greenhouse-polythene-cover-8m-x-15m` draft created at calculated source cost KSh 13,800 (120m² × KSh115/m²); photo imports 1497/1498 failed HTTP 422. Remains inactive.
- `16mm-0-3mm-double-emitter-drip-tape-1000m-roll` draft created from Hortitechno KSh 7,500/roll; photo import request 1499 failed HTTP 422. Remains inactive.
- Do not activate failed-image drafts until an exact product image is uploaded and verified. Product-page generation/sitemap refresh not yet verified.


## 2026-11-11 — SEO description length audit (owner correction)

- Owner requires 600+ words in every product description (target 600–900 words, original and SKU-specific). Short product blurbs are not acceptable SEO content.
- Audited active catalogue in Supabase: 892 active products; 402 descriptions are under 600 words; 490 meet the minimum. This is a confirmed content backlog, not a completed fix.
- The six new poultry/net listings from this batch are currently only 44–56 words and therefore FAIL the owner’s SEO word-count requirement. Their images/prices/activation do not make their descriptions SEO-compliant.
- Existing `add_draft_product` currently accepts 40–2,000 words, despite PUBLISHING.md specifying 600–900. This validation mismatch must be corrected so future short descriptions cannot pass.
- Next: remediate descriptions in small, verifiable batches; preserve each existing description in `description_backup` before updates; use product-specific verified facts, Kenyan search intent, meaningful buying/application guidance and FAQs, not repeated filler. Run word-count audit after each batch. Do not claim all catalogue SEO fixed until every active product is >=600 words and quality checked.


## 2026-11-11 — Corrected the five recent live product descriptions

- Owner called out the five recent product uploads as messy/short. Backed up original descriptions into `public.product_description_backups` before edits.
- Rewrote all five descriptions with product-specific sections (overview, facts/specifications, use/planning, buying guide, care, FAQs and Kenyan search intent), 600+ words each. No price, stock, image, slug or activation changes.
- Verified word counts: 5kg broiler feeder 778; 3L manual drinker 733; 6L manual drinker 770; 24-hole trough feeder 735; UV bird net 748. All five remain active with their existing images and verified source-price rows.
- Next: enforce 600–900 words at the database publishing function and repair remaining catalogue descriptions in audited batches; active catalogue audit previously found 402/892 under 600 words.

## 2026-11-12 (Africa/Nairobi, ~10:15) - whole-number prices, 00/50/99 endings, checkout check

### Done
- Owner rule: every product price and old_price must end in 00, 50 or 99 (e.g. 250, 399, 300), no decimals. Applied to all 955 products by rounding UP to the next allowed ending (avg +KSh 16, never lowers a price). Old prices kept above the selling price.
- Backups: `products_price_backup_20261112` (original decimal prices) and `products_price_backup_20261112b` (after whole-number rounding).
- Guard: trigger `trg_products_round_prices` on `public.products` (function `products_round_prices`) snaps price/old_price on insert or update, so new products follow the rule automatically.
- Product pages and merchant feed rebuilt via the product-pages workflow dispatch (run 43167368829). Google's cached snippet (e.g. Grain-Save Dust KSh 590.52) is stale and clears after re-crawl; request indexing in Search Console to speed up.
- Checkout review: cart/total code reads prices from the displayed text with `replace(/\D/g, '')`, so decimals in displayed prices would have inflated totals (590.52 -> 59052). Whole numbers remove that risk.

### Not verified
- Live checkout page could not be fetched from this session (domain not on allowlist). Card payment is still off in code (`card: false`) until Paystack live is approved; M-Pesa STK push is on (`stk: true`), production vs sandbox not checked. `orders` table is empty, so no real order to inspect.

### Next
- Place one test order on stermontarcade.co.ke (M-Pesa) and confirm the total matches the displayed prices.

## 2026-11-12 (Africa/Nairobi, ~12:20) - Mosquito Window Net Kit size added

### Done
- Product `mosquito-window-net-screen` (created 2026-11-05 08:50 Nairobi): description now has a SPECIFICATIONS section (listed size 130-150 cm, mesh 250 cm x 120 cm, fits most home indoor windows, self-adhesive, cut to fit), and the three sentences telling buyers to confirm the size from the pack were updated. Sizes supplied by the owner.
- Backup of the previous description: `products_description_backup_20261112`.
- Product pages rebuilt via the product-pages workflow dispatch.

### Open
- Generic Rafiki "Product" social card is used as the photo on `actara-25-wg-insecticide-8g`, `rafiki-magnetic-mosquito-net-for-windows`, `rafiki-magnetic-mosquito-window-screen` (identical 45,080-byte file in product-images). Waiting for real photos from the owner (8 g sachet for Actara; Rafiki screens). Also waiting on owner choice for the missing Actara 1 kg pack.

## 2026-11-12 (Africa/Nairobi, ~12:30) - Magnetic Mosquito Net Door Curtain 90 x 210 cm (draft)

### Done
- Draft created: `magnetic-mosquito-net-door-curtain-90-x-210-cm` (category 28 Garden & Outdoors, unit "1 piece"). Source page: https://brightstartech.co.ke/product/magnetic-mosquito-net-door-curtain-90-x-210-cm/ (not reachable from the session; the owner supplied the KES price 1300 as the source cost).
- Owner asked for 30% profit: 1300 x 1.30 = 1690, snapped up by the price trigger to 1699 (00/50/99 rule). stock=1000, low_at=20, featured=false, active=false.
- Description is generic and factual (size 90 x 210 cm from the listing title); colour, material, magnets and accessories were NOT verified from the supplier page and the description tells buyers to confirm them.

### Blocked
- No photo yet (mandatory before `active=true`). Needs an exact photo of this door curtain from the owner or a reachable source.

### Next
- When a photo is supplied: attach via `upload-photos` / `public.add_product_photo`, verify Storage object and `products.images`, then `select public.activate_product_if_photo_ok('magnetic-mosquito-net-door-curtain-90-x-210-cm');`, rebuild pages with the product-pages workflow dispatch.
- Possible duplicate to review: live `magnetic-mosquito-door-screen-90x210cm` (KSh 699).


## 2026-11-12 — Pest-control sprayer SEO remediation continuation

- Restored the full prior handoff history and appended this progress note; no earlier handoff sections were intentionally removed.
- The first SEO pass had already expanded three live products: Total TSPLI20162 (1,240 words), Turbo TR20 (1,043), and EMAS 16L (1,110).
- This continuation backed up each original description in `products_description_backup_20261112` before updating four more live products. Verified database word counts:
  - Aico Japan AC767-4 25L 4-Stroke Petrol Knapsack Sprayer — 1,320 words.
  - Aico Japan AC840PS 8HP Petrol Trolley Sprayer with Hose Reel — 1,421 words.
  - SOLO Model 425 Professional 15L Piston Backpack Sprayer — 1,357 words.
  - Aico Japan AC1609 160L 8HP Petrol Trolley Sprayer — 1,403 words.
- Content is SKU-specific, distinguishes supplier-listed facts from unconfirmed specifications, and covers suitable use, calibration considerations, safe operation, cleaning, maintenance, buying checks and FAQs. No prices, stock, images, activation or slugs were changed.
- SEO-compliant descriptions among the 13 live sprayer products: 7 / 13 verified. Six still need 600+ word rewrites: Aico AC-8L, Kato KT767-4, Milano ML767-4, Kzubr KBS-20L, Kenagro 20L and Uvuko UVBM20L.
- Product-page rebuild and sitemap refresh are still pending verification for these description changes.


## 2026-11-12 — Pest-control sprayer SEO descriptions completed

- Rewrote and verified the remaining six active sprayer descriptions in category 31, bringing the 13/13 live products in this 50-item batch to at least 600 words each.
- Latest database-verified word counts:
  - Aico Japan AC-8L 8L Manual Pressure Sprayer — 1,299.
  - Kato Germany KT767-4 25L Petrol Knapsack Sprayer — 1,405.
  - Milano Italia ML767-4 25L Petrol Knapsack Sprayer — 1,350.
  - Kzubr KBS-20L Rechargeable Knapsack Sprayer — 1,311.
  - Kenagro 20L Manual and Electric Sprayer — 1,325.
  - Uvuko UVBM20L Dual Battery and Manual Sprayer — 1,410.
- Combined with prior verified counts (Total 1,240; Turbo 1,043; EMAS 1,110; Aico AC767-4 1,320; AC840PS 1,421; SOLO 425 1,357; AC1609 1,403), all 13 active sprayer listings now pass the 600-word minimum.
- All 13 remain active. No price, image, stock, slug or activation fields were changed in the SEO rewrite.
- Original descriptions for the seven products edited in this latest pass are preserved in `products_description_backup_20261112`. For the first three rewritten earlier in this workflow, the backup rows were inserted only after the rewrite as snapshots of the new descriptions; their original short blurbs were not captured in that table. Do not describe those three snapshot rows as pre-edit originals.
- SEO copy distinguishes listed facts from details requiring seller confirmation; no runtime, coverage or compatibility guarantees were invented.
- Product page rebuild, static HTML refresh, SEO meta description/title review and sitemap verification remain pending. No claim that the updated text is already visible on the live website.

### Batch status
- Live products: 13 / 50.
- Live sprayer product descriptions meeting 600+ words: 13 / 13.
- Remaining catalogue batch items to add: 37.
- Aico Japan 60L 7.5HP trolley sprayer remains inactive and photo-blocked; not counted as published.


## 2026-11-12 — Pest-control batch continuation: Fly Catcher Sticky Fly Paper

### Published and verified
- Added and activated `fly-catcher-sticky-fly-paper-8-piece-pack` in category 31 (Pest Control & Fumigation).
- Supplier listing: Rafiki Pest Control Agrovet, eight-piece variant KSh 1,200: https://shop.rafikipestcontrol.com/products/fly-catcher
- Exact product photo imported from the supplier's product image CDN: https://sokowise-api.b-cdn.net/media/7961.webp?etag=ee67af5f6b916e7e9e95f4147e9d5817&height=640&width=640
- Photo upload request 1766 returned HTTP 200 with `ok:true`, one photo stored, and `live:false` before activation. Public Storage URL: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/fly-catcher-sticky-fly-paper-8-piece-pack-mwdfbje041.jpg
- Verified final row: active=true, featured=true, stock=1000, low_at=20, cost=KSh 1,200, stored selling price KSh 1,599, one image in `products.images`.
- Description word count: 982 (verified in database), with product-specific details, supplier limitations, placement guidance, hygiene, safety, Kenyan buying checks and FAQs.
- The 30% helper markup calculates KSh 1,560 before the site's price-point trigger; the trigger rounds the stored selling price up to KSh 1,599. The source listing price is a retail reference, not a verified acquisition cost or guaranteed net profit.
- Product link: https://stermontarcade.co.ke/?product=fly-catcher-sticky-fly-paper-8-piece-pack

### Build status
- Database activation and image attachment are verified. Product-page rebuild/static HTML and sitemap refresh are still pending verification; do not claim the public static page is refreshed until the generated page and sitemap are checked.

### Batch status
- Live products: 14 / 50.
- Remaining items: 36.
- Continue only with distinct items supported by a current Kenyan KES reference price and exact matching photo. Keep descriptions at 600+ words and verify image storage before activation.


## 2026-11-12 — Pest-control batch continuation: UV fly-killer research (held, not published)

- Weighing Scale Solutions lists a 20W Electric Fly Insect Killer at KSh 5,500 excluding VAT: https://weighingscalessolutions.co.ke/product/20w-electric-fly-insect-killer/. Supplier claims two UV tubes, 60 m² stated coverage, enclosed steel safety net, hanging chain and removable collection tray; free Nairobi shipping, other areas charged.
- The same supplier's category page lists 10W replacement lamps (two-piece pack) at KSh 600 excluding VAT and 15W fly-killer bulbs at KSh 800 excluding VAT. Compatibility must be checked against the exact installed unit before listing replacement tubes.
- The supplier's 30W page is internally inconsistent: title says 30W while detailed specification says 6W. Do not use until clarified.
- No new product was created. The direct matching image for the 20W model was not verified; image search showed other brands/models, which must not be substituted. No image upload or activation was attempted.
- A category_id 31 name query did not return a matching insect-killer name, but catalogue-wide duplicate checking and exact model identity still need to be confirmed before a generic unit is inserted.
- Next: continue with non-chemical physical pest-control equipment. Require exact supplier model, current KES price/tax treatment, in-stock status, matching direct photo and catalogue-wide duplicate check. Keep the agreed 30% markup, 600+ word description, stock 1000, low_at 20 and featured=true; activate only after image verification.


## 2026-11-12 — Pest-control product batch continuation

### Verified catalogue state
- Rechecked `PUBLISHING.md`, `CLAUDE.md`, and Supabase `site_playbook` topics `READ_ME_FIRST`, `add_product`, and `add_photo`.
- The latest batch-specific Supabase rule uses the 7-argument `add_draft_product(..., 30)` for the owner's 30% markup. It does not change the global default.
- The 13 sprayer products in the current batch are all active, each has one image URL, and each description now measures over 600 words.
- Pest Control & Fumigation category 31 currently has 54 active products and 56 total rows (including two inactive drafts). This is the entire category, not the count of newly added items.

### New draft — photo upload blocked
- Product: Portable Thermal Fogging Machine
- ID/slug: `portable-thermal-fogging-machine`
- Source page: https://www.metrotools.co.ke/fogging-machine-price-in-kenya.html
- Supplier listing price: KSh 32,000; stored as source cost KSh 32,000.
- Batch markup: 30%; stored selling price KSh 41,600.
- Description: 942 words, product-specific, includes confirmed facts and clearly marks unknown machine specifications for supplier confirmation.
- SEO title: `Portable Thermal Fogging Machine – Price in Kenya`
- Stock=1000, low_at=20, featured=false.
- Supplier page photograph URL located: https://www.metrotools.co.ke/images/fogging1.jpg
- Attempted upload using both the direct image URL and supplier product-page URL. Supabase upload-photos returned HTTP 422: could not download image (timeout/network error); requested image_base64 for retry. A third attempt against the non-www image host also returned HTTP 422 with the same network timeout.
- Product remains inactive with no image (correctly not published). Do not send a live product link. Next: obtain the exact supplier image bytes (or another exact supplier/manufacturer image) and upload via image_base64; verify Storage object + products.images, then activate.

### Next
- Continue researching distinct pest-control equipment with current Kenyan KES source prices and exact product photos.
- Keep 30% batch markup, stock 1000, low_at 20, 600+ word descriptions, and photo-before-activation gate. Do not duplicate existing sprayers, traps, nets or pest-control products.


## 2026-11-12 — Additional 20 pest-control products published

Added a further 20 distinct products in Supabase category_id 31 (Pest Control & Fumigation) using `public.add_draft_product` with 30% markup_pct, then attached product images using `public.add_product_photo(product_id, source_url, true, false)`. All 20 returned HTTP 200 with `ok=true`, `live=true`, and exactly one image stored in the public `product-images` bucket. Final DB verification: 20 active rows, 20 with one image, all stock=1000 and low_at=20. SEO titles were generated by the helper. Two image-failed temporary drafts (GRINBELT and Fumakilla cordless mat set) were left inactive and then deleted; they are not part of the 20 published items.

New live products (source cost → current selling price, KSh):
- Snail CCT Snail Control Solution 1 Litre: 2,000 → 2,600
- Glue Book Mouse Traps: 266 → 350
- Bat Repellant Powder 250g: 666 → 899
- Velcro Windows Mosquito Net: 2,132 → 2,799
- 4pcs Sticky Ribbon Fly Catcher Trap: 400 → 550
- Double-Sided Yellow Sticky Flying Pest Insect Trap: 840 → 1,099
- Atraprat Rat Rodent and Mice Glue 135g: 666 → 899
- Bipronex Cockroach Gel Bait 5g: 3,000 → 3,900
- Green Leaf Cockroach Killer 50 Sachets: 4,000 → 5,200
- Pali 50 WP Pesticide 20g: 466 → 650
- Imidex Mendeclean Bait Gel 10g: 866 → 1,150
- Insecticide Chalk Twin Luck 15g: 200 → 299
- Flower Floral Scented Mossi Chips Mosquito Killer Mats 30g: 610 → 799
- Mortein Doom LED Refill 45ml: 1,621 → 2,150
- FASTKILL Regular Aerosol 180ml: 650 → 850
- FASTKILL Odourless Aerosol 180ml: 650 → 850
- Flower Natural Sandal Mosquito Killer Sticks 20g: 128 → 199
- Sevin Dudu Dust Insecticide 100g: 466 → 650
- Mos-Kill Spira Liquid Refill 25ml: 499 → 650
- Bottom Door Sealer Strip 1m: 350 → 499

The helper applies store price-point rounding after the 30% markup calculation, so some displayed prices have an effective markup above 30%; do not reset these without explicit owner instruction. Each item has a supplier source URL recorded in its product row. All are live and should use the mobile-shell product route `https://stermontarcade.co.ke/?product=<slug>`; generated static pages follow the existing rebuild schedule.


SEO follow-through for the 20-product batch: updated all 20 active product descriptions to long-form, product-specific copy exceeding 600 words each (database verification returned descriptions_600_plus=20). Re-verified after this update: active_count=20, one_image_count=20, stock_correct_count=20. No image or activation status changed during the description update.


## 2026-11-12 — Product-photo mismatch audit and first corrections

### Confirmed issue
- Owner supplied a screenshot of a Rafiki Pest Control Products banner being used where an individual product photograph should appear. A banner/logo is not an acceptable product image.
- Supabase catalogue currently contains 1,141 product rows, 1,109 active; no active product row is image-empty.
- A catalogue query found repeated image URLs across distinct pack-size variants, which is a strong mismatch signal and requires exact pack-size review before replacement. Examples include Actellic 50EC (100ml/250ml/500ml/1L), Air Chopper 7.5SC (15ml 3-pack/100ml/250ml/1L), Bat CRP (250ml/500ml/1L), and several other insecticide families. A shared URL is not automatically wrong when the same packaging image genuinely applies, so do not bulk-delete based only on URL reuse.

### Replaced the known generic Rafiki banner image
- `actara-25-wg-insecticide-8g`: replaced the generic Rafiki social-card image with the product image extracted from the exact 8g Actara 25WG listing: https://agropests.com/products/actara-25wg-40g. Upload request 1796 returned HTTP 200, `ok=true`, `live=true`, one photo. Row remains active.
- `rafiki-magnetic-mosquito-net-for-windows`: replaced the generic social card with the image extracted from the matching Rafiki product listing: https://shop.rafikipestcontrol.com/products/magnetic-mosquito-nets-for-windows. Request 1797 returned HTTP 200, `ok=true`, `live=false`, one photo. Row remains inactive.
- `rafiki-magnetic-mosquito-window-screen`: replaced the generic social card with the image extracted from the matching Rafiki kitchen-window net listing: https://shop.rafikipestcontrol.com/products/magnetic-mosquito-net-for-kitchen-windows. Request 1798 returned HTTP 200, `ok=true`, `live=false`, one photo. Row remains inactive.
- Final database check confirms each row now has one new product-image Storage URL; activation states were preserved.

### Remaining work / guardrails
- The catalogue-wide photo audit is not complete. Shared pack-size images and other visual mismatches still need item-by-item review.
- Supabase already has a staff-only `find-photo` Edge Function. Its `auto` mode searches candidate photos, checks dimensions (minimum 450×450), and uses Gemini to verify brand/model/pack-size match and reject other-shop branding. It requires a signed-in staff Authorization header and will not replace an existing image. Run it through the authenticated admin workflow for products with suspect existing photos; do not bypass its checks or guess source URLs.
- Prioritize exact-pack-size mismatches, generic brand banners/social cards, images with other sellers' watermarks, and images showing a different brand/model. Replace only after exact match is verified. Do not deactivate otherwise-valid products solely because an image URL is reused.
