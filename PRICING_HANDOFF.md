# Stermont Arcade — Pricing Review Handoff

Date: 2026-11-17 (Africa/Nairobi)
Repository: `stermontmall/stermontmall.github.io`
Base: `main` at `df17473e0701363312387b6fac6ef336788c9299`
Working branch: `pricing/non-syngenta-market-review-20261117`
Batch size: 100 active catalogue products, alphabetical by product name and ID.
Scope: non-Syngenta catalogue only. Product names/IDs/prices were read from `public.products`; brand/manufacturer are not separate columns in that table, so exclusion screening used product names plus known brand/product identities.

## Batch 1 summary

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 0 |
| Products with verified supplier price and price update prepared | 12 |
| Verified products already at the rounded markup price (no change needed) | 1 |
| Products flagged [NEEDS MANUAL PRICE CHECK] | 87 |
| New pack variants added | 0 |

**Important:** The price changes below are committed as a guarded SQL script on this branch. They have **not** been applied to the live Supabase catalogue or storefront. The script aborts if a product's current price no longer matches the captured pre-review price. Existing product IDs, slugs and URLs are preserved. No price was inferred from the existing `cost` column.

## Markup and rounding

- Supplier price below KSh 20,000: 30%
- KSh 20,000–39,999: 25%
- KSh 40,000–60,000: 20%
- Above KSh 60,000: 17.5%
- Final price rounded to nearest KSh 50.

## Batch 1 prepared price updates

| Product Name | Pack Size | Supplier Price (KES) | Markup Tier | New Website Price (KES) | Source Reference |
|---|---|---:|---:|---:|---|
| 1 L Rabbit Drinker with Steel Nipple and Wall Bracket | piece | 900 | 30% | 1,150 | https://www.myagrovet.co.ke/rabbit-drinkers |
| 3-Litre Manual Chicken Drinker | piece | 350 | 30% | 450 | https://mkulimajovial.co.ke/product-category/poultry/manual-drinkers/ |
| 3kg Poultry Feeder with Anti-Waste Separator Ring | piece | 350 | 30% | 450 | https://www.ecochickspoultry.com/shop/3kg-chicken-feeder-with-anti-waste-separator-ring/ |
| 40-Litre Poultry Drinker with Automatic Cup Drinkers | piece | 1,950 | 30% | 2,550 | https://www.myagrovet.co.ke/products.php?id=7019 |
| 5 kg Broiler Chicken Feeder | piece | 420 | 30% | 550 | https://mkulimajovial.co.ke/product/5kg-broiler-chicken-feeder/ (wholesale MOQ 20) |
| 64-Egg Automatic Incubator with Digital Controls | piece | 12,000 | 30% | 15,600 | https://mkulimajovial.co.ke/product-category/poultry/incubators/ |
| 64-Egg Incubator WQ JF-64, 220V or 12V, Auto Turning | piece | 14,700 | 30% | 19,100 | https://www.myagrovet.co.ke/products.php?id=5988 |
| 528-Egg Commercial Automatic Incubator | piece | 55,000 | 20% | 66,000 | https://ecochickspoultry.com/ |
| 1056-Egg Fully Automatic Commercial Incubator | piece | 65,000 | 17.5% | 76,400 | https://ecochickspoultry.com/ |
| Abalone 18EC Insecticide 50ml | 50ml bottle | 145 | 30% | 200 | https://www.farmrescue.co.ke/product/abalone-18-ec |
| Accent 600SC Insecticide 50ml | 50ml bottle | 485 | 30% | 650 | https://www.farmrescue.co.ke/product/accent-600sc |
| 4pcs Sticky Ribbon Fly Catcher Trap | pack of 4 | 450 | 30% | 600 | https://www.jumia.co.ke/green-sticky-ribbon-fly-catcher-trap-pack-of-4-132038852.html |

## Verified — no price change required

| Product Name | Supplier Price (KES) | Markup Tier | Correct Rounded Price (KES) | Current Website Price (KES) | Source |
|---|---:|---:|---:|---:|---|
| 13cm Air Stone for Fish Ponds | 2,000 | 30% | 2,600 | 2,600 | https://shop.mft.co.ke/air-stones-x-13cm |

## [NEEDS MANUAL PRICE CHECK]

- [NEEDS MANUAL PRICE CHECK] **0.5 L Rabbit Water Bottle with Stainless Steel Nipple** (ID: `0-5-l-rabbit-water-bottle-with-stainless-steel-nipple`; current KSh 520) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1 Litre Hand Pressure Sprayer** (ID: `1-litre-hand-pressure-sprayer`; current KSh 250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1 Ton/hr Feed Grinder and Mixer Set** (ID: `1-ton-hr-feed-grinder-and-mixer-set`; current KSh 338,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1.5kg Poultry Feeder with Anti-Scatter Ring** (ID: `1-5kg-poultry-feeder-anti-scatter-ring`; current KSh 199) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **10 Litre Poultry Drinker, UV-Resistant, Stands or Hangs** (ID: `10-litre-poultry-drinker-uv-resistant-stands-or-hangs`; current KSh 975) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **10-Pack 6L Poultry Drinkers, UV-Resistant, Tehno Mss** (ID: `10-pack-6l-poultry-drinkers-uv-resistant-tehno-mss`; current KSh 6,370) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **100-Chick Automatic Smart Brooder Controller** (ID: `100-chick-automatic-smart-brooder-controller`; current KSh 39,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **110m Submersible DC Solar Water Pump with 1100W Panel Kit** (ID: `110m-submersible-dc-solar-water-pump-with-1100w-panel-kit`; current KSh 127,400) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **11L Plastic Poultry Drinker with Red Base** (ID: `11l-plastic-poultry-drinker-with-red-base`; current KSh 1,150) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **12-Inch LCD Writing Board for Kids** (ID: `kids-12in-lcd-writing-board`; current KSh 1,150) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **12V DC Solar Surface Water Pump 25m Head** (ID: `12v-dc-solar-surface-water-pump-25m-head`; current KSh 12,740) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **14-inch Heavy Duty Leather Welding Gloves with Inner Lining** (ID: `14-inch-heavy-duty-leather-welding-gloves-inner-lining`; current KSh 550) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **150-Piece Kids Art Set** (ID: `kids-150pc-art-set`; current KSh 1,850) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **150W Laptop Charger Adapter 19.5V 7.7A for ASUS (A17-150P1A)** (ID: `asus-150w-laptop-charger-adapter-19-5v-7-7a`; current KSh 5,550) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **16mm 0.3mm Double-Emitter Drip Tape 1000m Roll** (ID: `16mm-0-3mm-double-emitter-drip-tape-1000m-roll`; current KSh 9,750) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1HP Electric Water Pump for Farm Irrigation** (ID: `1hp-electric-water-pump-for-farm-irrigation`; current KSh 11,050) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1L Calf Feeding Bottle with Silicone Teat** (ID: `1l-calf-feeding-bottle-with-silicone-teat`; current KSh 1,050) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2 Litre Hand Pressure Sprayer** (ID: `2-litre-hand-pressure-sprayer-2-litres`; current KSh 699) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2 Stripes Reflective Vest AA12** (ID: `2-stripes-reflective-vest-aa12`; current KSh 250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2-in-1 Petrol Power Shredder** (ID: `2-in-1-petrol-power-shredder`; current KSh 188,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **20-Litre Poultry Bucket with Automatic Cup Drinkers** (ID: `20-litre-poultry-bucket-with-automatic-cup-drinkers`; current KSh 1,699) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Honda Fit Foreign Used – Kenya** (ID: `2019-honda-fit-foreign-used-kenya`; current KSh 1,897,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Honda Grace Foreign Used – Kenya** (ID: `2019-honda-grace-foreign-used-kenya`; current KSh 2,242,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Mazda Demio Foreign Used – Kenya** (ID: `2019-mazda-demio-foreign-used-kenya`; current KSh 1,725,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Nissan Dayz Roox Highway Star Foreign Used – Kenya** (ID: `2019-nissan-dayz-roox-highway-star-foreign-used-kenya`; current KSh 1,138,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Suzuki Bandit Solio Foreign Used – Kenya** (ID: `2019-suzuki-bandit-solio-foreign-used-kenya`; current KSh 1,587,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Suzuki Every Foreign Used – Kenya** (ID: `2019-suzuki-every-foreign-used-kenya`; current KSh 1,380,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Suzuki Swift Foreign Used – Kenya** (ID: `2019-suzuki-swift-foreign-used-kenya`; current KSh 2,150,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Toyota Axio Foreign Used – Kenya** (ID: `2019-toyota-axio-foreign-used-kenya`; current KSh 2,242,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Toyota Corolla Fielder Foreign Used – Kenya** (ID: `2019-toyota-corolla-fielder-foreign-used-kenya`; current KSh 2,415,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Toyota Passo Foreign Used – Kenya** (ID: `2019-toyota-passo-foreign-used-kenya`; current KSh 1,380,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Toyota Succeed Van Foreign Used – Kenya** (ID: `2019-toyota-succeed-van-foreign-used-kenya`; current KSh 2,127,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Toyota Townace GL Foreign Used – Kenya** (ID: `2019-toyota-townace-gl-foreign-used-kenya`; current KSh 2,185,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2019 Toyota Vitz Foreign Used – Kenya** (ID: `2019-toyota-vitz-foreign-used-kenya`; current KSh 1,782,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2020 Peugeot 208 Allure Foreign Used – Kenya** (ID: `2020-peugeot-208-allure-foreign-used-kenya`; current KSh 2,150,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2020 Toyota Probox 1.5L Foreign Used – Kenya** (ID: `2020-toyota-probox-1-5l-foreign-used-kenya`; current KSh 1,782,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2020 Toyota Yaris Foreign Used – Kenya** (ID: `2020-toyota-yaris-foreign-used-kenya`; current KSh 1,955,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **20kg Anti-Spillage Poultry Feeder, UV-Resistant Plastic** (ID: `20kg-anti-spillage-poultry-feeder-uv-resistant-plastic`; current KSh 2,015) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **24-Hole Chicken Trough Feeder** (ID: `24-hole-chicken-trough-feeder`; current KSh 299) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **27cm Self-Filling Water Bowl for Sheep and Goats, Green** (ID: `27cm-self-filling-water-bowl-for-sheep-and-goats-green`; current KSh 2,080) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2L Calf Nursing Bottle, Silicone Teat and Measure Marks** (ID: `2l-calf-nursing-bottle-silicone-teat-and-measure-marks`; current KSh 1,170) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2L Self-Filling Livestock Drinker with Copper Valve** (ID: `2l-self-filling-livestock-drinker-with-copper-valve`; current KSh 2,275) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3-in-1 Soil Tester: Moisture, Light and pH, No Battery Needed** (ID: `3-in-1-soil-tester-moisture-light-and-ph-no-battery-needed`; current KSh 2,860) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3-Inch Diesel Water Pump with 8HP Engine** (ID: `3-inch-diesel-water-pump-with-8hp-engine`; current KSh 38,998.7) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **300kg Feed Pellet Making Machine** (ID: `300kg-feed-pellet-making-machine`; current KSh 169,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **30W T8 UV-A BL368 Insect Trap Replacement Tube 895mm** (ID: `30w-t8-uva-bl368-insect-trap-tube-895mm`; current KSh 2,199) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **32 Inch Frameless QLED Smart Android 14 TV** (ID: `32-inch-frameless-qled-smart-android-tv-free-accessories`; current KSh 15,299) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **365nm UV Blacklight Inspection Flashlight** (ID: `uv365-blacklight-inspection-flashlight-20261108`; current KSh 1,800) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3L Stainless Steel Self-Filling Cattle Drinker, Float Valve** (ID: `3l-stainless-steel-self-filling-cattle-drinker-float-valve`; current KSh 4,550) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3M 6700 Series Full-Face Respirator** (ID: `3m-6700-full-face-respirator-20261108`; current KSh 12,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3M 8210 N95 Disposable Dust Respirator** (ID: `3m-8210-n95-dust-respirator`; current KSh 950) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3M Peltor Optime 98 H9 Hearing Protection Earmuffs** (ID: `3m-peltor-optime-98-h9-hearing-protection-earmuffs`; current KSh 1,900) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **3M Ultrafit Reusable Earplugs** (ID: `3m-ultrafit-reusable-earplugs`; current KSh 599) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **4 Stripped Orange Reflective Vest** (ID: `4-stripped-orange-reflective-vest`; current KSh 350) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **4-in-1 Garden Tool Set, 52cc 2.2HP Petrol Multi-Tool** (ID: `4-in-1-garden-tool-set-52cc-2-2hp-petrol-multi-tool`; current KSh 48,750) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **40-Mesh Insect Net 2.5m x 50m Roll** (ID: `40-mesh-insect-net-2-5m-x-50m-roll`; current KSh 16,250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **46-Piece Kids Art Set** (ID: `kids-46pc-art-set`; current KSh 1,150) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **50% UV Shade Net 4m x 50m Roll** (ID: `50-uv-shade-net-4m-x-50m-roll`; current KSh 15,999) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **500 ml Pet Water Bottle with Stainless Steel Nipple, No Drip** (ID: `500-ml-pet-water-bottle-with-stainless-steel-nipple-no-drip`; current KSh 585) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **500kg Feed Pellet Making Machine** (ID: `500kg-feed-pellet-making-machine`; current KSh 208,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **500kg/hr Feed Grinder and Mixer Set** (ID: `500kg-hr-feed-grinder-and-mixer-set`; current KSh 130,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **50cm Linear Chick Feeder with 28 Feeding Holes** (ID: `50cm-linear-chick-feeder-with-28-feeding-holes`; current KSh 499) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **50m Submersible DC Solar Water Pump 24V 250W Panel Kit** (ID: `50m-submersible-dc-solar-water-pump-24v-250w-panel-kit`; current KSh 31,850) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **5L Cone Poultry Drinker, WQ, White and Red Plastic** (ID: `5l-cone-poultry-drinker-wq-white-and-red-plastic`; current KSh 494) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **6 Litre Poultry Drinker for 12 Birds, Legs and Metal Handle** (ID: `6-litre-poultry-drinker-for-12-birds-legs-and-metal-handle`; current KSh 1,183) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **6-Litre Manual Chicken Drinker** (ID: `6-litre-manual-chicken-drinker`; current KSh 499) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **64PCS Magnetic Building Sticks and Balls STEM Set** (ID: `kids-magnetic-sticks-balls-64pcs`; current KSh 2,899) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **6kg Anti-Waste Poultry Feeder, UV-Resistant, Chicks and Hens** (ID: `6kg-anti-waste-poultry-feeder-uv-resistant-chicks-and-hens`; current KSh 624) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **7-in-1 Montessori Puzzle Block** (ID: `kids-7in1-montessori-puzzle`; current KSh 2,899) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **75m Submersible DC Solar Water Pump with 750W Panel Kit** (ID: `75m-submersible-dc-solar-water-pump-with-750w-panel-kit`; current KSh 71,175) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **8 Litre Gravity Poultry Drinker, UV-Resistant Plastic** (ID: `8-litre-gravity-poultry-drinker-uv-resistant-plastic`; current KSh 585) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **8kg Poultry Feeder with Lid and Anti-Waste Tray** (ID: `8kg-poultry-feeder-with-lid-and-anti-waste-tray`; current KSh 3,799) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **90 Degree Rabbit Water Nipples, Set of 10, Steel Tip** (ID: `90-degree-rabbit-water-nipples-set-of-10-steel-tip`; current KSh 2,338.7) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abacus Advance 125 SE Fungicide 1L** (ID: `abacus-advance-125-se-fungicide-1l`; current KSh 5,499) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abamite Abamectin Insecticide 50ml** (ID: `abamite-abamectin-insecticide-50ml`; current KSh 250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abasi 5% EC** (ID: `abasi-5-ec-100-ml`; current KSh 699) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abasi 5% EC** (ID: `abasi-5-ec-250-ml`; current KSh 1,650) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abasi 5% EC** (ID: `abasi-5-ec-50-ml`; current KSh 450) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abasi 5% EC** (ID: `abasi-5-ec-500-ml`; current KSh 3,199) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Abasi 5% EC Insecticide (1 Litre)** (ID: `abasi-5-ec`; current KSh 4,899) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Absolute 375SC Systemic Fungicide** (ID: `absolute-375sc-systemic-fungicide-greenlife-1-litres`; current KSh 7,450) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Absolute 375SC Systemic Fungicide** (ID: `absolute-375sc-systemic-fungicide-greenlife-100-ml`; current KSh 799) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Absolute 375SC Systemic Fungicide** (ID: `absolute-375sc-systemic-fungicide-greenlife-250-ml`; current KSh 1,799) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **Absolute 375SC Systemic Fungicide** (ID: `absolute-375sc-systemic-fungicide-greenlife-50-ml`; current KSh 450) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **ACE Altra Safety Shoes – Black** (ID: `ace-altra-safety-shoes-black`; current KSh 3,299) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **ACE Armour Safety Shoes** (ID: `ace-armour-safety-shoes`; current KSh 2,999) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **ACE Duma Safety Shoes – Grey** (ID: `ace-duma-safety-shoes-grey`; current KSh 3,299) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.

## Pack-size review

No new pack variants were added in Batch 1. Abasi 5 EC manufacturer literature lists 5L and 20L packs in addition to the existing 50ml, 100ml, 250ml, 500ml and 1L variants, but no verified Kenyan supplier prices for the 5L or 20L packs were found in this batch; therefore those variants were not created. Source: https://www.eabcl.co.ke/wp-content/uploads/2026/03/Abasi-5-EC.pdf

## Files

- `supabase/sql/pricing-batch-001.sql` — guarded SQL price changes for the 12 updated products.
- `PRICING_HANDOFF.md` — this batch log.

## Safety / next steps

- Do not run this SQL against production until the branch review confirms all supplier prices, pack matches and guards.
- No live database prices, stock, product IDs, slugs, URLs or images were changed by this branch commit.
- Continue with Batch 2 using the next 100 active catalogue products after the Batch 1 sort order.
