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
| Products with verified supplier price and price update prepared | 23 |
| Verified products already at the rounded markup price (no change needed) | 3 |
| Products flagged [NEEDS MANUAL PRICE CHECK] after recheck | 74 |
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

- [RECHECKED — NO PRICE CHANGE] **0.5 L Rabbit Water Bottle with Stainless Steel Nipple** (ID: `0-5-l-rabbit-water-bottle-with-stainless-steel-nipple`;  current KSh 520) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1 Litre Hand Pressure Sprayer** (ID: `1-litre-hand-pressure-sprayer`; current KSh 250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1 Ton/hr Feed Grinder and Mixer Set** (ID: `1-ton-hr-feed-grinder-and-mixer-set`; current KSh 338,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **1.5kg Poultry Feeder with Anti-Scatter Ring** (ID: `1-5kg-poultry-feeder-anti-scatter-ring`;  current KSh 199) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **10 Litre Poultry Drinker, UV-Resistant, Stands or Hangs** (ID: `10-litre-poultry-drinker-uv-resistant-stands-or-hangs`;  current KSh 975) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **10-Pack 6L Poultry Drinkers, UV-Resistant, Tehno Mss** (ID: `10-pack-6l-poultry-drinkers-uv-resistant-tehno-mss`;  current KSh 6,370) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **100-Chick Automatic Smart Brooder Controller** (ID: `100-chick-automatic-smart-brooder-controller`; current KSh 39,000) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **110m Submersible DC Solar Water Pump with 1100W Panel Kit** (ID: `110m-submersible-dc-solar-water-pump-with-1100w-panel-kit`;  current KSh 127,400) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **11L Plastic Poultry Drinker with Red Base** (ID: `11l-plastic-poultry-drinker-with-red-base`;  current KSh 1,150) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **12-Inch LCD Writing Board for Kids** (ID: `kids-12in-lcd-writing-board`; current KSh 1,150) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **12V DC Solar Surface Water Pump 25m Head** (ID: `12v-dc-solar-surface-water-pump-25m-head`;  current KSh 12,740) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **14-inch Heavy Duty Leather Welding Gloves with Inner Lining** (ID: `14-inch-heavy-duty-leather-welding-gloves-inner-lining`;  current KSh 550) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **150-Piece Kids Art Set** (ID: `kids-150pc-art-set`; current KSh 1,850) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **150W Laptop Charger Adapter 19.5V 7.7A for ASUS (A17-150P1A)** (ID: `asus-150w-laptop-charger-adapter-19-5v-7-7a`; current KSh 5,550) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **16mm 0.3mm Double-Emitter Drip Tape 1000m Roll** (ID: `16mm-0-3mm-double-emitter-drip-tape-1000m-roll`; current KSh 9,750) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1HP Electric Water Pump for Farm Irrigation** (ID: `1hp-electric-water-pump-for-farm-irrigation`; current KSh 11,050) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **1L Calf Feeding Bottle with Silicone Teat** (ID: `1l-calf-feeding-bottle-with-silicone-teat`; current KSh 1,050) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2 Litre Hand Pressure Sprayer** (ID: `2-litre-hand-pressure-sprayer-2-litres`; current KSh 699) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **2 Stripes Reflective Vest AA12** (ID: `2-stripes-reflective-vest-aa12`;  current KSh 250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **2-in-1 Petrol Power Shredder** (ID: `2-in-1-petrol-power-shredder`; current KSh 188,500) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **20-Litre Poultry Bucket with Automatic Cup Drinkers** (ID: `20-litre-poultry-bucket-with-automatic-cup-drinkers`;  current KSh 1,699) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
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
- [RECHECKED — PRICE UPDATE PREPARED] **3-in-1 Soil Tester: Moisture, Light and pH, No Battery Needed** (ID: `3-in-1-soil-tester-moisture-light-and-ph-no-battery-needed`;  current KSh 2,860) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
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
- [RECHECKED — NO PRICE CHANGE] **4 Stripped Orange Reflective Vest** (ID: `4-stripped-orange-reflective-vest`;  current KSh 350) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **4-in-1 Garden Tool Set, 52cc 2.2HP Petrol Multi-Tool** (ID: `4-in-1-garden-tool-set-52cc-2-2hp-petrol-multi-tool`; current KSh 48,750) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **40-Mesh Insect Net 2.5m x 50m Roll** (ID: `40-mesh-insect-net-2-5m-x-50m-roll`; current KSh 16,250) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [NEEDS MANUAL PRICE CHECK] **46-Piece Kids Art Set** (ID: `kids-46pc-art-set`; current KSh 1,150) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
- [RECHECKED — PRICE UPDATE PREPARED] **50% UV Shade Net 4m x 50m Roll** (ID: `50-uv-shade-net-4m-x-50m-roll`;  current KSh 15,999) — no exact, verifiable in-stock Kenyan supplier quote confirmed for this pack/model in Batch 1.
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


---

# Batch 2 — 2026-11-17

Batch order: next 100 active products alphabetically by product name and ID (offset 100 from the Batch 1 query).

## Batch 2 summary

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 15 |
| Products with verified in-stock supplier price and price update prepared (after recheck) | 15 |
| Products flagged [NEEDS MANUAL PRICE CHECK] after recheck | 70 |
| New pack variants added | 0 |

**Syngenta exclusions:** Actara 25 WG Insecticide 8g; Actara 25WG Insecticide 40g; Actellic 25EC Insecticide; Actellic 300 CS Public Health Insecticide 833ml; Actellic 50EC Insecticide; Actellic 50EC Insecticide; Actellic 50EC Insecticide; Actellic 50EC Insecticide; Actellic Gold Dust; Actellic Gold Dust; Actellic Gold Dust; Actellic Gold Dust 200g; Actellic Gold Dust 50g; Actellic Super Dust 50g; Agral 90 Non-Ionic Spray Adjuvant 1L. Agita is not counted as Syngenta: Kenya PCPB identifies Elanco Animal Health as its manufacturer/registrant. Agil is ADAMA-branded, not Syngenta.

## Batch 2 prepared price updates

| Product Name | Pack Size | Supplier Price (KES) | Markup Tier | New Website Price (KES) | Source Reference |
|---|---|---:|---:|---:|---|
| Acetak Top 700WG Insecticide 5g | 5g sachet | 100 | 30% | 150 | https://agropests.com/products/acetak-top-700wg-5g |
| Acrobat 69% WG Fungicide 1kg | 1kg pack | 3,430 | 30% | 4,450 | https://agroduka.ke/acrobat-69-wg-1kg/ |
| Agromectin 18 EC Insecticide 50ml | 50ml bottle | 220 | 30% | 300 | https://www.farmrescue.co.ke/product/agromectin-insecticide |
| AgroZ Bag Plus Hermetic Grain Storage Bag 100kg | piece | 290 | 30% | 400 | https://agropests.com/products/agrozr-bag-plus-hermetic-storage-bag-100kgs |
| AICO 0.5HP Deep Well Submersible Pump 80m Head | piece | 18,500 | 30% | 24,050 | https://www.logike.co.ke/product/AICO-Japan-0-5HP-80-Meters-Deep-Well-Electric-Submersible-Pump/96872817 |
| Aico Japan AC767-4 25L 4-Stroke Petrol Knapsack Sprayer | 1 unit | 22,000 | 25% | 27,500 | https://www.jumia.co.ke/aico-ac767-4-petrol-knapsack-sprayer-25l-4-stroke-knapsack-sprayer-agricultural-sprayer-327885947.html |
| AILYONS 2 in 1 Blender with Grinder, 1.6L, 4 Speed Control, Safety Lock | 1 blender with grinder jar (1.6 L) | 1,460 | 30% | 1,900 | https://www.jumia.co.ke/ailyons-tyb-205-pro-2-in-1-blender-grinder-1.6l-350w-4-speed-control-pulse-safety-lock-black-328896946.html |
| Albafas 10% Albendazole Drench | — | 880 | 30% | 1,150 | https://prd.erp.agribora.com/input/agrochemicals/pesticides/albafas-10-1l-ktrmr |

## [NEEDS MANUAL PRICE CHECK]

- [NEEDS MANUAL PRICE CHECK] **ACE Fusion Safety Shoes** (ID: `ace-fusion-safety-shoes`; current KSh 2,999) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **ACE Mamba High-Ankle Safety Shoes – Blue** (ID: `ace-mamba-high-ankle-safety-shoes-blue`; current KSh 3,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **ACE Mamba Warehouse Safety Boots – Blue/Black** (ID: `ace-mamba-warehouse-safety-boots-blue-black`; current KSh 3,500) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **ACE Tsavo Steel-Toe Safety Gumboots – Black** (ID: `ace-tsavo-steel-toe-safety-gumboots-black`; current KSh 1,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **ACE Wolverine Safety Shoes** (ID: `ace-wolverine-safety-shoes`; current KSh 3,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Acetak Top 700WG Insecticide 25g** (ID: `acetak-top-700wg-insecticide-25g`; current KSh 450) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Acetak Top 700WG Insecticide 50g** (ID: `acetak-top-700wg-insecticide-50g`; current KSh 750) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Acetastar 46EC Insecticide 100ml** (ID: `acetastar-46ec-insecticide-100ml`; current KSh 399) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Acetastar 46EC Insecticide 1L** (ID: `acetastar-46ec-insecticide-1l`; current KSh 3,199) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Acetastar 46EC Insecticide 50ml** (ID: `acetastar-46ec-insecticide-50ml`; current KSh 250) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Adidas Runfalcon 3.0 Men's Black Running Sneakers** (ID: `adidas-runfalcon-30-black-mens-sneakers-20261108`; current KSh 5,499) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Advance In-Ground Termite Monitoring Station** (ID: `advance-termite-monitoring-bait-station-20261108`; current KSh 2,200) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AEROBS AB-HP20 7.5HP High Pressure Petrol Water Pump – 2-Inch** (ID: `aerobs-ab-hp20-7-5hp-high-pressure-petrol-water-pump-2-inch`; current KSh 29,898.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **African Daisy Mixed Colours Flower Seeds** (ID: `african-daisy-mixed-colours-flower-seeds`; current KSh 455) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agil 100 EC Herbicide 1 Litre** (ID: `agil-100-ec-herbicide-1-litre`; current KSh 5,250) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agita 10 WG Fly Bait 80g** (ID: `agita-10-wg-fly-bait-80g`; current KSh 5,250) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agita 1GB Fly Bait** (ID: `agita-1gb-fly-bait-100-g`; current KSh 2,150) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agita 1GB Fly Bait** (ID: `agita-1gb-fly-bait-20g`; current KSh 299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agita 1GB Fly Bait** (ID: `agita-1gb-fly-bait-400-g`; current KSh 11,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agrimec 018EC Insecticide 100ml** (ID: `agrimec-018ec-insecticide-100ml`; current KSh 1,399) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agripack 600-27A Hybrid Maize Seeds** (ID: `agripack-600-27a-hybrid-maize-seeds`; current KSh 899) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agripack Maize 5117 Seeds** (ID: `agripack-maize-5117-seeds`; current KSh 899) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agriwin 72WP Fungicide 500g** (ID: `agriwin-72wp-fungicide-500g`; current KSh 1,150) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agro-Lambda 5EC Insecticide** (ID: `agro-lambda-5ec-insecticide-1-litre`; current KSh 2,950) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agro-Lambda 5EC Insecticide** (ID: `agro-lambda-5ec-insecticide-100-ml`; current KSh 599) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agro-Lambda 5EC Insecticide** (ID: `agro-lambda-5ec-insecticide-250-ml`; current KSh 1,050) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agrochemical Protective Spray Suit** (ID: `agrochemical-protective-spray-suit`; current KSh 2,600) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [RECHECKED — PRICE UPDATE PREPARED] **Agromaster 16-10-22 Controlled Release Fertilizer 25kg** (ID: `agromaster-16-10-22-controlled-release-fertilizer-25kg`;  current KSh 4,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AgroZ Black and White Silage Bag 350–400kg** (ID: `agroz-black-and-white-silage-bag-350-400kg`; current KSh 1,599) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AgroZ Silage Bag 1.0m x 2.5m** (ID: `agroz-silage-bag-1-0m-x-2-5m`; current KSh 1,495) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AgroZ Silage Storage Bag 1m x 2.5m** (ID: `agroz-silage-storage-bag-1m-x-2-5m`; current KSh 1,499) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agvanta 500 SC Fungicide 1 litre** (ID: `agvanta-500-sc-fungicide-1-litre`; current KSh 10,000) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agvanta 500 SC Fungicide 100ml** (ID: `agvanta-500-sc-fungicide-100ml`; current KSh 1,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agvanta 500 SC Fungicide 250ml** (ID: `agvanta-500-sc-fungicide-250ml`; current KSh 2,750) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agvanta 500 SC Fungicide 500ml** (ID: `agvanta-500-sc-fungicide-500ml`; current KSh 5,150) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Agvanta 500 SC Fungicide 50ml** (ID: `agvanta-500-sc-fungicide-50ml`; current KSh 750) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico 0.5HP Booster Water Pump – 30 Metres Head** (ID: `aico-0-5hp-booster-water-pump-30-metres-head`; current KSh 9,750) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 10HP 4-Inch Diesel Water Pump | Heavy Duty** (ID: `aico-10hp-4-inch-diesel-water-pump-heavy-duty`; current KSh 77,998.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 16HP Diesel High Pressure Water Pump – 3 Inch** (ID: `aico-16hp-diesel-high-pressure-water-pump-3-inch`; current KSh 82,940) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico 1HP Booster Water Pump** (ID: `aico-1hp-booster-water-pump`; current KSh 11,050) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 1HP Deep Well Submersible Pump 150m Head** (ID: `aico-1hp-deep-well-submersible-pump-150m-head`; current KSh 23,398.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico 1HP Shallow Well Submersible Water Pump** (ID: `aico-1hp-shallow-well-submersible-water-pump`; current KSh 17,160) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 2-Inch Diesel High-Pressure Water Pump 90m Head** (ID: `aico-2-inch-diesel-high-pressure-water-pump-90m-head`; current KSh 68,898.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico 2HP Centrifugal Booster Water Pump** (ID: `aico-2hp-centrifugal-booster-water-pump`; current KSh 23,400) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 2HP Deep Well Submersible Pump 210m Head** (ID: `aico-2hp-deep-well-submersible-pump-210m-head`; current KSh 31,198.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 3-Inch Petrol Sewage Pump 25mm Solids** (ID: `aico-3-inch-petrol-sewage-pump-25mm-solids`; current KSh 41,598.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 3HP DW3000 Deep Borehole Submersible Pump 220m** (ID: `aico-3hp-dw3000-deep-borehole-submersible-pump-220m`; current KSh 36,398.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 4HP 3-Phase Deep Well Submersible Pump 224m** (ID: `aico-4hp-3-phase-deep-well-submersible-pump-224m`; current KSh 49,398.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO 5.5HP 3-Phase Deep Well Submersible Pump 256m** (ID: `aico-5-5hp-3-phase-deep-well-submersible-pump-256m`; current KSh 77,998.7) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico AC-5L 5-Litre Manual Pressure Sprayer** (ID: `aico-ac-5l-5-litre-manual-pressure-sprayer`; current KSh 2,299) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico Japan 60L 7.5HP Trolley Agricultural Sprayer** (ID: `aico-japan-60l-7-5hp-trolley-agricultural-sprayer`; current KSh 67,600) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico Japan AC-8L 8L Shoulder Strap Manual Pressure Sprayer** (ID: `aico-japan-ac-8l-8l-shoulder-strap-manual-pressure-sprayer`; current KSh 3,350) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico Japan AC1609 160L 8HP Petrol Trolley Sprayer** (ID: `aico-japan-ac1609-160l-8hp-petrol-trolley-sprayer`; current KSh 90,999) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Aico Japan AC840PS 8HP Petrol Trolley Sprayer with Hose Reel** (ID: `aico-japan-ac840ps-8hp-petrol-trolley-sprayer-with-hose-reel`; current KSh 35,099) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AICO Japan ADP50 8HP 2-Inch Diesel Water Pump** (ID: `aico-japan-adp50-8hp-2-inch-diesel-water-pump`; current KSh 40,950) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS 2-Burner Table-Top Gas Cooker with 6kg Regulator, 1.5m Pipe and Clips** (ID: `ailyons-2-burner-table-top-gas-cooker-with-6kg-regulator-1-5m-pipe-and-clips`; current KSh 1,899) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS 2.0L Electric Kettle, Glossy Black with Red Accents** (ID: `ailyons-2-0l-electric-kettle-glossy-black-with-red-accents`; current KSh 799) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS 2.2L Electric Kettle, Luxury Dark Purple** (ID: `ailyons-2-2l-electric-kettle-luxury-dark-purple`; current KSh 1,099) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS 2L Stainless Steel Electric Kettle 1500W, Auto Shut-Off** (ID: `ailyons-2l-stainless-steel-electric-kettle-1500w-auto-shut-off`; current KSh 540.5) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS 5L Electric Pressure Cooker, 900W, 10 Preset Menus** (ID: `ailyons-5l-electric-pressure-cooker-900w-10-preset-menus`; current KSh 4,799) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS 6L Digital Electric Pressure Cooker with Rice, Soup, Beef, Chicken and Porridge Presets** (ID: `ailyons-6l-electric-pressure-cooker-digital`; current KSh 5,499) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS AFK-111 Hot & Normal Water Dispenser With Cabinet** (ID: `ailyons-afk-111-hot-normal-water-dispenser-with-cabinet`; current KSh 5,175) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS AFK-112 Three-Tap Hot Cold Normal Water Dispenser** (ID: `ailyons-afk-112-three-tap-hot-cold-normal-water-dispenser`; current KSh 6,450) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS Double Burner Glass Top Gas Cooker with Free 6kg Regulator, Gas Pipe and Clips, 1 Year Warranty** (ID: `ailyons-double-burner-glass-gas-cooker-regulator-pipe`; current KSh 2,399) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS FK-0301 2L Stainless Steel Electric Kettle 1500W** (ID: `ailyons-fk-0301-2l-stainless-steel-electric-kettle-1500w`; current KSh 540.5) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS FS-1801K 18-Inch 60W Standing Fan Black** (ID: `ailyons-fs-1801k-18-inch-60w-standing-fan-black`; current KSh 2,988.85) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS HD-198A White & Blue Electric Dry Iron** (ID: `ailyons-hd-198a-white-blue-electric-dry-iron`; current KSh 1,022.35) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **AILYONS HD-199A 1000W Electric Dry Iron Silver & Black** (ID: `ailyons-hd-199a-1000w-electric-dry-iron-silver-black`; current KSh 805) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Air Chopper 7.5SC Insecticide** (ID: `air-chopper-7-5sc-insecticide-1-litre`; current KSh 8,599) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Air Chopper 7.5SC Insecticide** (ID: `air-chopper-7-5sc-insecticide-100-ml`; current KSh 1,200) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Air Chopper 7.5SC Insecticide** (ID: `air-chopper-7-5sc-insecticide-15-ml-3-pk`; current KSh 899) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Air Chopper 7.5SC Insecticide** (ID: `air-chopper-7-5sc-insecticide-250-ml`; current KSh 3,050) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Airofog U260 Professional ULV Cold Fogger** (ID: `airofog-u260-ulv-cold-fogger-20261108`; current KSh 165,000) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Albafas 10% Albendazole Drench** (ID: `albafas-10-albendazole-drench-120-ml`; current KSh 199) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Albafas 10% Albendazole Drench** (ID: `albafas-10-albendazole-drench-40-ml`; current KSh 150) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Albafas 10% Albendazole Drench** (ID: `albafas-10-albendazole-drench-5-litres`; current KSh 4,450) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.
- [NEEDS MANUAL PRICE CHECK] **Albafas 10% Albendazole Drench** (ID: `albafas-10-albendazole-drench-500-ml`; current KSh 599) — no exact, verified in-stock supplier price confirmed for this pack/model in Batch 2.

## Pack-size review

No new variants were added. AgriGuard's Agrimec 18EC listing identifies 50ml, 100ml, 250ml and 1L pack options and shows a 1L price of KSh 2,350, but the source did not explicitly confirm current stock for the 1L option. The missing 1L variant is therefore held for manual stock verification; no speculative listing was created.

## Files

- `supabase/sql/pricing-batch-002.sql` — guarded SQL price changes for the 8 updated products.
- `PRICING_HANDOFF.md` — this batch log.

**Live status:** SQL is committed to the review branch only. It has not been applied to Supabase or the live storefront. Existing product IDs, slugs and URLs remain unchanged.


---

# Batch 1 — broader search recheck (2026-11-17)

Reprocessed the 87 initially flagged records using short brand/core-name/pack queries, active ingredient queries where relevant, and Kenyan supplier/site searches. Search found 12 usable exact or close model/pack price references, including the 2 products below already matching their formula. These are price references, not supplier invoices. Where only a retail listing was available, estimated baseline = lowest matched Kenyan retail listing × 0.85 as instructed. Factory rates are identified separately.

## Recheck results

| Product ID | Baseline cost (KES) and method | Markup | Calculated retail (KES) | Competitor retail (KES) | Alert | Sources |
|---|---:|---:|---:|---:|---|---|
| 1-5kg-poultry-feeder-anti-scatter-ring | 119 (estimated retail less 15%) | 30% | 150 | 140 |  | https://www.ecochickspoultry.com/product-category/chicken-feeders/; https://www.fugaequipment.co.ke/feeders-drinkers-prices-kenya.html |
| 10-litre-poultry-drinker-uv-resistant-stands-or-hangs | 484.5 (estimated retail less 15%) | 30% | 650 | 570 |  | https://mkulimajovial.co.ke/product-category/poultry/manual-drinkers/; https://www.myagrovet.co.ke/products.php?id=5709 |
| 10-pack-6l-poultry-drinkers-uv-resistant-tehno-mss | 4,165 (estimated retail less 15%) | 30% | 5,400 | 4,900 |  | https://myagrovet.com/product/professional-6l-poultry-water-system-10-pack-uv-resistant-set; https://www.myagrovet.co.ke/products.php?cid=443&producer=82 |
| 11l-plastic-poultry-drinker-with-red-base | 1,045.5 (estimated retail less 15%) | 30% | 1,350 | 1,230 |  | https://ecochickspoultry.com/product-category/chicken-drinkers/ |
| 12v-dc-solar-surface-water-pump-25m-head | 8,330 (estimated retail less 15%) | 30% | 10,850 | 9,800 |  | https://juvalinnovations.co.ke/product/12v-dc-solar-surface-water-pump-25m-head/; https://metroequipment.co.ke/product/12v-dc-solar-surface-water-pump-25m-head/ |
| 14-inch-heavy-duty-leather-welding-gloves-inner-lining | 382.5 (estimated retail less 15%) | 30% | 500 | 450 |  | https://www.nairobisafetyshop.org/product-category/ppe/ |
| 2-stripes-reflective-vest-aa12 | 170 (estimated retail less 15%) | 30% | 200 | 200 |  | https://www.nairobisafetyshop.org/product-category/ppe/ |
| 20-litre-poultry-bucket-with-automatic-cup-drinkers | 1,020 (estimated retail less 15%) | 30% | 1,350 | 1,200 |  | https://ecochickspoultry.com/product-category/chicken-drinkers/ |
| 3-in-1-soil-tester-moisture-light-and-ph-no-battery-needed | 1,870 (estimated retail less 15%) | 30% | 2,450 | 2,200 |  | https://myagrovet.com/product/3-in-1-soil-ph-meter-moisturelightph-tester; https://www.myagrovet.co.ke/products.php?id=4983 |
| 110m-submersible-dc-solar-water-pump-with-1100w-panel-kit | 83,300 (estimated retail less 15%) | 17.5% | 98,000 | 98,000 |  | https://juvalinnovations.co.ke/product/110m-submersible-dc-solar-water-pump-with-1100w-solar-panel-kit/; https://powerport.co.ke/product-category/water-pumps/solar-pumps/ |
| 50-uv-shade-net-4m-x-50m-roll | 15,000 (published factory rate) | 30% | 19,500 | 18,000 |  | https://www.symnet.co.ke/solutions/agro-shade-nets; https://www.shadenets.co.ke/ |
| 0-5-l-rabbit-water-bottle-with-stainless-steel-nipple | 400 (retail less 15%) | 30% | 520 | 490 | No change | https://myagrovet.com/product/premium-500ml-leak-proof-rabbit-water-bottle-with-steel-nipple; https://www.myagrovet.co.ke/products.php?id=5961 |
| 4-stripped-orange-reflective-vest | 255 (retail less 15%) | 30% | 350 | 300 | No change | https://www.nairobisafetyshop.org/product-category/ppe/ |

## Newly prepared changes

11 more Batch 1 prices are now included in the guarded `pricing-batch-001.sql` script. Two additional products already match the formula and remain unchanged. No verified exact pack-size additions were found in this recheck. Existing slugs/URLs are unchanged.

## Still requiring manual verification

The other initially flagged Batch 1 products remain marked `[NEEDS MANUAL PRICE CHECK]` because no reliable exact model/pack supplier listing was found. This includes products where online results were only generic, unmatched capacity/specification, import estimates, unverified seller listings, or non-comparable models. The 87 original flags are not being silently cleared.

## Important market comparison note

The exact 1.5kg feeder is listed at KSh 140 by Fuga and KSh 180 by Ecochicks; its formula price is KSh 150 using a retail-minus-15% estimate. The 10L poultry drinker is listed at KSh 570 by Mkulima Jovial, KSh 700 by Ecochicks and KSh 750 by MyAgrovet; formula price KSh 650. The 50% shade-net 4m × 50m factory rate is KSh 15,000 at Symnet, with a KSh 18,000 retail comparison at Shadenets; formula price KSh 19,500. These calculated prices do not exceed the 15% alert threshold against multiple comparable retailers in the results found.

**Live status:** The guarded SQL remains a branch artifact. No production prices were changed by this recheck.


---

# Batch 2 — broader search recheck (2026-11-17)

Re-searched the 77 initially flagged records using brand/core product/pack-size and active-ingredient queries across Kenyan supplier sites. Seven catalogue rows now have usable matching references and guarded price updates. No new pack variants were created; ALONZE 50EC supplier pages confirm 25ml, 50ml, 100ml, 250ml and 1L options, all of which are already represented in the existing catalogue, but only 1L had a clear, in-stock price in the pages returned.

| Product ID | Baseline (KES) and method | Markup | Calculated retail (KES) | Competitor retail (KES) | Competitor check | Sources |
|---|---:|---:|---:|---:|---|---|
| algreen-hynitro-42-high-nitrogen-foliar-fertilizer-1l | 587.35 (AgriJibu retail KSh691 less 15%) | 30% | 750 | 691 | No alert: below 15% threshold | https://agrijibu.co.ke/crop-production/fertilizers/foliar-fertilizer/ |
| algreen-planta-p-liquid-foliar-fertilizer-1l | 807.5 (AgriJibu retail KSh950 less 15%) | 30% | 1,050 | 950 | No alert: below 15% threshold | https://agrijibu.co.ke/crop-production/fertilizers/foliar-fertilizer/ |
| algreen-supa-k-high-potassium-foliar-fertilizer-1l | 518.5 (AgriJibu retail KSh610 less 15%) | 30% | 650 | 610 | No alert: below 15% threshold | https://agrijibu.co.ke/crop-production/fertilizers/foliar-fertilizer/ |
| agromaster-16-10-22-controlled-release-fertilizer-25kg | 3,570 (AgriJibu retail KSh4,200 less 15%) | 30% | 4,650 | 4,200 | No alert: below 15% threshold | https://agrijibu.co.ke/crop-production/fertilizers/ |
| aico-japan-ac767-4-25l-4-stroke-petrol-knapsack-sprayer | 15,725 (lowest matched retail KSh18,500 less 15%) | 30% | 20,450 | 18,500 | No alert: below 15% threshold | https://myagrovet.com/product/professional-25cc-motorized-backpack-sprayer-4-stroke-engine; https://www.jumia.co.ke/aico-petrol-knapsack-sprayer-ac767-4.-25l-knapsack-sprayer-327588025.html; https://www.myagrovet.co.ke/products.php?id=7501 |
| alonze-50-ec-miticide-1l | 6,740.5 (Agroduka in-stock retail KSh7,930 less 15%) | 30% | 8,750 | 7,930 | No alert: below 15% threshold | https://agroduka.ke/alonze-50ec/ |
| alonze-50ec-abamectin-insecticide-1-litre | 6,740.5 (Agroduka in-stock retail KSh7,930 less 15%) | 30% | 8,750 | 7,930 | No alert: below 15% threshold | https://agroduka.ke/alonze-50ec/ |

Algreen Bonzin is listed in a price range KSh370–1,170, but the 1L variant price is not unambiguously separated in the listing, so its current price remains unchanged and flagged. Hynitro 42 1L, Planta-P 1L and Supa-K 1L are separately priced by AgriJibu. The AICO AC767-4 is listed by MyAgrovet and several Jumia sellers at KSh18,500–21,000; the lowest matching retail listing was used for the retail-minus-15% estimate. Agroduka confirms Alonze 50EC 1L in stock at KSh7,930.

**Batch 2 revised counts:** 100 scanned; 15 Syngenta exclusions; 15 price updates prepared in total (8 initial + 7 recheck); 70 still needing manual price checks; 0 new pack variants. No live database prices were changed.


---

# Batch 3 — 2026-11-17

Scanned the next 100 active catalogue records (alphabetical order, offset 200). Syngenta products excluded: Amistar 250 SC 5L, Amistar Top 325 SC 5L, Amistar Xtra 280 SC 5L, Alto 100 SL 250ml, Ampligo 150 ZC (1L, 100ml, 250ml, 50ml), Apron Star 42 WS (10g, 1kg), and Artea 330 EC 5L. The exclusion count is 11.

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 11 |
| Verified supplier/retail-benchmark price updates prepared | 11 |
| Remaining manual checks | 78 |
| New pack variants | 0 |

## Batch 3 pricing updates

Baseline values below use the lowest matching Kenyan retail price less 15% where no wholesale price was published. They are estimates, not supplier quotes.

| Product ID | Baseline (KES) and method | Markup | Calculated retail (KES) | Competitor retail (KES) | Competitor check | Sources |
|---|---:|---:|---:|---:|---|---|
| aliette-wg80-systemic-fungicide-1kg | 4,233 (AgriJibu retail KSh4,980 less 15%) | 30% | 5,500 | 4,980 | No alert: under 15% vs lowest listed competitor | https://agrijibu.co.ke/aliette-wg80/; https://dawnfarmers.com/shop/crop-production/fungicides/aliette-wg80-1kg/; https://agroduka.ke/aliette-wg80-1kg/ |
| alpha-king-10-ec-insecticide-50ml | 131.75 (Farm Rescue in-stock retail KSh155 less 15%) | 30% | 150 | 155 | No alert: under 15% vs lowest listed competitor | https://www.farmrescue.co.ke/product/alpha-king-10-ec |
| alpha-king-insecticide-1l | 1,921 (Farm Rescue in-stock retail KSh2,260 less 15%) | 30% | 2,500 | 2,260 | No alert: under 15% vs lowest listed competitor | https://www.farmrescue.co.ke/product/alpha-king-10-ec |
| aluminium-milking-can-20l | 7,225 (Mkulima Jovial retail KSh8,500 less 15%) | 30% | 9,400 | 8,500 | No alert: under 15% vs lowest listed competitor | https://mkulimajovial.co.ke/price-list/ |
| amimax-720-wp-fungicide-1kg | 1,500.25 (AgriJibu retail KSh1,765 less 15%) | 30% | 1,950 | 1,765 | No alert: under 15% vs lowest listed competitor | https://agrijibu.co.ke/brand/amiran-kenya-limited/ |
| aminika-wh403-hybrid-maize-seeds-2kg | 680 (AgriJibu retail KSh800 less 15%) | 30% | 900 | 800 | No alert: under 15% vs lowest listed competitor | https://agrijibu.co.ke/seeds/cereals-seeds/maize-seeds/; https://westernseedcompany.com/home/shop |
| aminika-wh504-hybrid-maize-seeds-2kg | 680 (AgriJibu retail KSh800 less 15%) | 30% | 900 | 800 | No alert: under 15% vs lowest listed competitor | https://agrijibu.co.ke/seeds/cereals-seeds/maize-seeds/; https://westernseedcompany.com/home/shop |
| aminika-wh507-hybrid-maize-seeds-2kg | 697 (Western Seed retail KSh820 less 15%) | 30% | 900 | 820 | No alert: under 15% vs lowest listed competitor | https://westernseedcompany.com/home/shop; https://agrijibu.co.ke/seeds/cereals-seeds/maize-seeds/ |
| aminika-wh508-hybrid-maize-seeds-2kg | 697 (Western Seed retail KSh820 less 15%) | 30% | 900 | 820 | No alert: under 15% vs lowest listed competitor | https://westernseedcompany.com/home/shop; https://agrijibu.co.ke/seeds/cereals-seeds/maize-seeds/ |
| ampia-gas-brooder | 6,375 (Mkulima/Masters/Mwamu retail KSh7,500 less 15%) | 30% | 8,300 | 7,500 | No alert: under 15% vs lowest listed competitor | https://mkulimajovial.co.ke/product/gas-warmer-chicken-brooders/; https://www.mastershardwares.co.ke/product/ampia-gas-brooder; https://mwamupoultry.co.ke/shop/?filter_cat=255 |
| ariane-ec-herbicide-1l | 3,689 (AgriJibu in-stock retail KSh4,340 less 15%) | 30% | 4,800 | 4,340 | No alert: under 15% vs lowest listed competitor | https://agrijibu.co.ke/ariane-ec-1l/ |

No competitor price alert was triggered in the results returned: calculated prices were not more than 15% above multiple reputable, exact-pack competitors. No new pack variants were added. Other Batch 3 records remain flagged for manual checks where the results were not exact enough or did not expose a reliable price.

SQL: `supabase/sql/pricing-batch-003.sql` (guarded, review branch only). Existing IDs, slugs and URLs preserved. No live prices changed.


---

# Batch 4 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 0 |
| Price updates prepared | 41 |
| No-change / below-current-price candidates retained | 0 |
| New pack variants | 0 |
| Needs manual price check | 59 |

Batch consists predominantly of Bajaj Boxer BM100/BM150 spare parts. The official Bajaj East Africa spares catalogue is used as the primary Kenya market price reference; exact BM models and part identities were matched. FDR Auto Garage listings provide secondary Nairobi retail checks for several of the same part numbers. As no public wholesale rates were explicitly identified, the baseline is the published retail price × 0.85, then 30% markup, rounded to KSh50. This is labelled [RETAIL-ESTIMATE], not wholesale. 

| Product / Part | Pack Size | Supplier/retail reference (KES) | Markup Tier | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| CDI Ignitor Assembly BM100 | 1 piece / exact model part | 2,200 retail; baseline 1,870 [RETAIL-ESTIMATE] | 30% | 2,450 | 2,200 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Lever Complete Assembly BM100 | 1 piece / exact model part | 750 retail; baseline 637.5 [RETAIL-ESTIMATE] | 30% | 850 | 750 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Front Wheel Bearing 6200 | 1 piece / exact model part | 399 retail; baseline 339.15 [RETAIL-ESTIMATE] | 30% | 450 | 399 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Fuel Tank Cap BM100 | 1 piece / exact model part | 650 retail; baseline 552.5 [RETAIL-ESTIMATE] | 30% | 700 | 650 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Oil Filter Cap | 1 piece / exact model part | 300 retail; baseline 255 [RETAIL-ESTIMATE] | 30% | 350 | 300 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Chain Tensioner | 1 piece / exact model part | 800 retail; baseline 680 [RETAIL-ESTIMATE] | 30% | 900 | 800 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Chain Sprocket Kit BM100 KS | 1 piece / exact model part | 2,850 retail; baseline 2,422.5 [RETAIL-ESTIMATE] | 30% | 3,150 | 2,850 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Chain Guide Kit BM100 KS | 1 piece / exact model part | 350 retail; baseline 297.5 [RETAIL-ESTIMATE] | 30% | 400 | 350 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Rotor Assembly BM100 KS | 1 piece / exact model part | 3,500 retail; baseline 2,975 [RETAIL-ESTIMATE] | 30% | 3,850 | 3,500 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Capacitor BM100 Old | 1 piece / exact model part | 299 retail; baseline 254.15 [RETAIL-ESTIMATE] | 30% | 300 | 299 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Cylinder Head BM100 Old | 1 piece / exact model part | 6,100 retail; baseline 5,185 [RETAIL-ESTIMATE] | 30% | 6,750 | 6,100 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Gear Shift Drum Stopper | 1 piece / exact model part | 250 retail; baseline 212.5 [RETAIL-ESTIMATE] | 30% | 300 | 250 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Rear Drum Brake Assembly | 1 piece / exact model part | 3,650 retail; baseline 3,102.5 [RETAIL-ESTIMATE] | 30% | 4,050 | 3,650 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Rear Sprocket Bearing 6004 | 1 piece / exact model part | 450 retail; baseline 382.5 [RETAIL-ESTIMATE] | 30% | 500 | 450 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Shock Damper BM100 | 1 piece / exact model part | 500 retail; baseline 425 [RETAIL-ESTIMATE] | 30% | 550 | 500 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Crankshaft Assembly BM150 5 Gear | 1 piece / exact model part | 6,199 retail; baseline 5,269.15 [RETAIL-ESTIMATE] | 30% | 6,850 | 6,199 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| 2nd Gear Drive | 1 piece / exact model part | 950 retail; baseline 807.5 [RETAIL-ESTIMATE] | 30% | 1,050 | 950 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| 4th Gear Drive | 1 piece / exact model part | 850 retail; baseline 722.5 [RETAIL-ESTIMATE] | 30% | 900 | 850 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Side Stand | 1 piece / exact model part | 300 retail; baseline 255 [RETAIL-ESTIMATE] | 30% | 350 | 300 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Headlamp Assembly | 1 piece / exact model part | 300 retail; baseline 255 [RETAIL-ESTIMATE] | 30% | 350 | 300 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Camshaft Assembly BM150 | 1 piece / exact model part | 1,150 retail; baseline 977.5 [RETAIL-ESTIMATE] | 30% | 1,650 | 1,150 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Carburettor Assembly BM150 | 1 piece / exact model part | 5,500 retail; baseline 4,675 [RETAIL-ESTIMATE] | 30% | 6,100 | 5,500 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Chain Sprocket Drive Kit BM150 | 1 piece / exact model part | 3,199 retail; baseline 2,719.15 [RETAIL-ESTIMATE] | 30% | 3,550 | 3,199 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Clutch Cable BM150 | 1 piece / exact model part | 400 retail; baseline 340 [RETAIL-ESTIMATE] | 30% | 450 | 400 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Crankcase LH BM150 | 1 piece / exact model part | 7,800 retail; baseline 6,630 [RETAIL-ESTIMATE] | 30% | 8,600 | 7,800 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Crankshaft BM150 | 1 piece / exact model part | 5,500 retail; baseline 4,675 [RETAIL-ESTIMATE] | 30% | 6,100 | 5,500 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Exhaust Assembly BM150 | 1 piece / exact model part | 12,000 retail; baseline 10,200 [RETAIL-ESTIMATE] | 30% | 13,300 | 12,000 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Front Fork Holder Assembly | 1 piece / exact model part | 1,950 retail; baseline 1,657.5 [RETAIL-ESTIMATE] | 30% | 2,150 | 1,950 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Front Wheel Axle | 1 piece / exact model part | 300 retail; baseline 255 [RETAIL-ESTIMATE] | 30% | 350 | 300 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Fuel Level Sensor BM150 | 1 piece / exact model part | 1,199 retail; baseline 1,019.15 [RETAIL-ESTIMATE] | 30% | 1,200 | 1,199 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Fuel Tap Assembly | 1 piece / exact model part | 450 retail; baseline 382.5 [RETAIL-ESTIMATE] | 30% | 500 | 450 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Headlamp Cowling 52PF1827 | 1 piece / exact model part | 1,899 retail; baseline 1,614.15 [RETAIL-ESTIMATE] | 30% | 2,100 | 1,899 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Left Handlebar Control Switch | 1 piece / exact model part | 350 retail; baseline 297.5 [RETAIL-ESTIMATE] | 30% | 400 | 350 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Lock Kit BM150 | 1 piece / exact model part | 1,950 retail; baseline 1,657.5 [RETAIL-ESTIMATE] | 30% | 2,150 | 1,950 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Oil Filter Cap with O-Ring | 1 piece / exact model part | 300 retail; baseline 255 [RETAIL-ESTIMATE] | 30% | 350 | 300 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Piston Assembly BM150 | 1 piece / exact model part | 1,500 retail; baseline 1,275 [RETAIL-ESTIMATE] | 30% | 1,650 | 1,500 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Timing Chain BM150 | 1 piece / exact model part | 700 retail; baseline 595 [RETAIL-ESTIMATE] | 30% | 750 | 700 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Wiring Harness BM150 | 1 piece / exact model part | 2,999 retail; baseline 2,549.15 [RETAIL-ESTIMATE] | 30% | 3,200 | 2,999 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Mesh Oil Filter | 1 piece / exact model part | 250 retail; baseline 212.5 [RETAIL-ESTIMATE] | 30% | 300 | 250 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Piston Rings 36PF0116 | 1 piece / exact model part | 650 retail; baseline 552.5 [RETAIL-ESTIMATE] | 30% | 700 | 650 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |
| Handle Holder Set | 1 piece / exact model part | 600 retail; baseline 510 [RETAIL-ESTIMATE] | 30% | 650 | 600 | https://bajajeastafrica.com/spares/; https://fdrautogarage.co.ke/product-category/auto-parts/ |

Items with calculated prices below their current storefront prices were not reduced under the profit-protection guardrail. Some low-cost exact parts are already priced at or above their calculated amount; those remain unchanged. The official Bajaj listing is not proof of stock for every individual item, so confirm stock before any eventual production application. No new variants were created. Existing slugs and URLs preserved.

SQL: `supabase/sql/pricing-batch-004.sql` (guarded, branch only; not production).


---

# Batch 5 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 0 |
| Price updates prepared | 12 |
| Newly added pack variants | 0 |
| Needs manual price check / unchanged | 88 |

## Prepared updates

| Product | Pack | Baseline Cost (KES) | Markup Tier | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| belt-480sc-insecticide-50ml | Current pack | 1,143.25 [RETAIL-ESTIMATE] | 30% | 1,500 | 1,345 (market avg 1,345) | https://www.farmrescue.co.ke/product/belt-480-sc |
| belt-480sc-insecticide-1l | Current pack | 22,792.75 [RETAIL-ESTIMATE] | 25% | 28,500 | 26,815 (market avg 26,815) | https://www.farmrescue.co.ke/product/belt-480-sc |
| bugati-500-sc-fungicide-50ml | Current pack | 1,274.15 [RETAIL-ESTIMATE] | 30% | 1,650 | 1,499 (market avg 1,499) | https://imaginecare.co.ke/product/bugati-500sc-50ml/; https://cheapthings.co.ke/product/bugati-500sc-50ml/ |
| boma-rhodes-1kg | Current pack | 1,530 [RETAIL-ESTIMATE] | 30% | 2,000 | 1,800 (market avg 1,883) | https://dawnfarmers.com/shop/crop-production-crop-production/seeds-fertilizers-crop-production-crop-production/seeds-seeds-fertilizers-crop-production-crop-production/boma-rhodes-1kg/; https://agrijibu.co.ke/boma-rhodes-1kg/; https://kuzaagrochem.com/products/boma-rhodes-1kg-679 |
| bromarat-0-005-rb-rodent-bait-25-g | Current pack | 849.15 [RETAIL-ESTIMATE] | 30% | 1,100 | 999 (market avg 999) | https://imaginecare.co.ke/shop/?orderby=date&product_count=100&product_order=asc&product_orderby=name&product_view=list&v=518f4a738816 |
| bromarat-0-005-rb-rodent-bait-100-g | Current pack | 1,274.15 [RETAIL-ESTIMATE] | 30% | 1,650 | 1,499 (market avg 1,499) | https://imaginecare.co.ke/shop/?orderby=date&product_count=100&product_order=asc&product_orderby=name&product_view=list&v=518f4a738816 |
| basf-goliath-cockroach-gel-bait-35g | Current pack | 7,208 [RETAIL-ESTIMATE] | 30% | 9,350 | 8,480 (market avg 9,630) | https://mtolori.com/product/details/goliath-gel-35g-1403; https://chemsasa.co.ke/product/goliath-cockroach-gel-35grams/; https://procapital.co.ke/agrochemicals/insecticides/goliath-gel-35g/; https://imaginecare.co.ke/product-category/fipronil/; https://agropests.com/products/goliath-gel-35g; https://www.bioderma.co.ke/product/cockroach-goliath-gel-35g/ |
| celebrat-a27-wireless-headphones | Current pack | 2,167.5 [RETAIL-ESTIMATE] | 30% | 2,800 | 2,550 (market avg 2,675) | https://crosstech.ke/products/celebrat-headphones-a27; https://www.jumia.co.ke/celebrat-celebrat-a27-wireless-headphones-bluetooth-5.3-40mm-driver-black-153762367.html; https://zentechelectronics.com/products/celebrat-a27-headphones |
| celebrat-a35-wireless-headphones | Current pack | 1,870 [RETAIL-ESTIMATE] | 30% | 2,450 | 2,200 (market avg 2,216.5) | https://crosstech.ke/products/celebrat-wireless-headphones-a35; https://www.jumia.co.ke/celebrat/ |
| celebrat-a41-active-noise-cancelling-headphones | Current pack | 2,975 [RETAIL-ESTIMATE] | 30% | 3,850 | 3,500 (market avg 3,574.5) | https://crosstech.ke/product-tags/headphones; https://www.jumia.co.ke/electronics-over-ear-headphones/celebrat/ |
| celebrat-w25-wireless-earbuds | Current pack | 1,270.75 [RETAIL-ESTIMATE] | 30% | 1,650 | 1,495 (market avg 1,622.5) | https://celebrat.co.ke/; https://crosstech.ke/product-tags/bluetooth-wireless |
| celebrat-w61-wireless-earbuds | Current pack | 1,530 [RETAIL-ESTIMATE] | 30% | 2,000 | 1,800 (market avg 2,000) | https://celebrat.co.ke/; https://crosstech.ke/product-tags/bluetooth-wireless |

The Goliath 35g reduction is supported by multiple separate Kenyan retailers (M-Tolori, Chemsasa, Pro-Capital, Imagine Care, Agropests and Bioderma); current KSh13,650 is materially above their market range, while the formula-derived KSh9,350 remains close to the market average. Celebrat A27/A35/A41 and W25/W61 reductions are supported by multiple local retailer/official store observations; existing prices exceeded the comparable-market average by more than 25%, meeting the explicit reduction exception. Other increases follow the 30%/25% tiers on 85% of the lowest matched retail listing.

Belt 480SC product pages list 50ml, 250ml and 1L; the existing catalogue already has 50ml, 250ml and 1L, so no additional pack was needed. Bugati 500SC supplier pages list 50ml, 100ml, 250ml, 500ml and 1L, but 100ml/250ml/500ml listings found were marked out of stock and the 1L price is not an exact in-stock supplier quote for this batch; no new pack variant was added. Bedlam's 15ml/50ml/100ml/1L variants already exist in the catalogue.

## Needs Manual Check

Remaining Batch 5 items include Bat CRP repellent variants, Bat repellent powder, Baraki 10g/100g/1kg, Velum Prime 40ml, Baygon aerosol, Bazooka and Beanpro, Bedlam variants where supplier prices were inconsistent or stock uncertain, bee equipment, Bestox, Betacyde, Betafos, BF150 fogger, Bigo, Billionaire, BioDistinction, Bipronex, BlackEarth, Blue-Touch glue traps, Booster, door sealer, Bradley, 10 motor-vehicle adverts, bug-related products not priced to exact pack, Burdizzo, seeds, calf equipment, irrigation hose, Catchmaster traps/UV unit, and Celebrat models without reliable matching multi-retailer data. These remain unchanged.

SQL: `supabase/sql/pricing-batch-005.sql` (guarded, review branch only; not applied to production). Existing product slugs/URLs preserved.


---

# Batch 6 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 4 |
| Existing product prices prepared for update | 3 |
| New verified pack variants prepared | 3 |
| Needs manual check / unchanged | 92 |

Syngenta products skipped untouched: Cruiser 350FS 5L, Daconil 720SC 500ml, Dithane Mancozeb 1kg, and Dual Gold 960EC 5L. Danadim Progress 400EC 1L is FMC/Cheminova-branded, not Syngenta, and remains eligible for pricing research.

## Price updates

| Product | Pack | Baseline Cost (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| chariot-500-sc-fungicide-1-litre | Existing pack | 1,683 [RETAIL-ESTIMATE] | 30% | 2,200 | 1,980 (avg 2,091.7) | https://agroduka.ke/index.php?dispatch=products.ut2_select_variation&product_id=826; https://dawnfarmers.com/shop/crop-production/fungicides/chariot-500sc/; https://www.farmrescue.co.ke/product/chariot-500-sc |
| dap-18-46-0-fertilizer-50kg | Existing pack | 3,655 [RETAIL-ESTIMATE] | 30% | 4,750 | 4,300 (avg 5,917) | https://www.waingofarm.co.ke/shop/dap-planting-fertilizer-50kg; https://agrijibu.co.ke/crop-production/fertilizers/; https://www.farmrescue.co.ke/ |
| dk777-hybrid-maize-seeds-2kg | Existing pack | 442 [RETAIL-ESTIMATE] | 30% | 600 | 520 (avg 760) | https://www.farmshieldkenya.co.ke/product/dk777-maize-seed-drought-tolerant-hybrid; https://agrijibu.co.ke/seeds/cereals-seeds/ |

DAP 50kg is reduced only because the existing KSh7,650 price is more than 25% above the observed average of comparable Kenyan retail benchmarks; the lowest currently listed in-stock private-retailer price is KSh4,300. DK777 2kg is similarly reduced only because the existing price is materially above multiple Kenya market observations, including a current in-stock 2kg pack at KSh520 and AgriJibu at KSh1,000. Chariot 500SC 1L is reduced from KSh3,199 to KSh2,200 because multiple exact 1L Kenyan listings cluster around KSh1,870–2,395, with Agroduka showing KSh1,980 in stock. All use 85% of the lowest reliable retail as estimated baseline and the 30% markup, rounded to KSh50.

## New pack variants

| Product | Pack | Lowest supplier retail (KES) | Baseline (KES) | Markup | New price (KES) | Source |
|---|---|---:|---:|---:|---:|---|
| Chariot 500 SC Fungicide | 100ml | 310 | 263.50 | 30% | 350 | https://www.farmrescue.co.ke/product/chariot-500-sc |
| Chariot 500 SC Fungicide | 250ml | 735 | 624.75 | 30% | 800 | https://www.farmrescue.co.ke/product/chariot-500-sc |
| Commander 240EC Herbicide | 100ml | 400 | 340 | 30% | 450 | https://agropests.com/products/commander-240ec-100ml |

Supplier pages confirm Chariot 500SC standard sizes 50ml, 100ml, 250ml, 500ml and 1L; 50ml and 1L already existed, 100ml and 250ml are prepared here, and 500ml remains manual because no exact in-stock price was verified. Commander 240EC has 100ml, 250ml, 500ml and 1L options; 1L already existed and 100ml is prepared here. Other missing sizes lack an exact verified in-stock price and are not created speculatively.

## Needs Manual Check

Remaining Batch 6 products (93 records after 4 Syngenta exclusions and 3 price changes) are unchanged where no exact, reliable supplier price was confirmed or where the formula target would require a price reduction that fails the 25%-over-market-average exception. This includes PPE, chick feeders, seeds, Dursban, Climb, Closer, cocopeat, cage traps, Combat products, Commander 1L (formula target lower than current but current not >25% over market average), Companion, Compliant, Confidor, beekeeping tools, honey sieve, dairy products, CoverMax, Cropgrow, monitoring traps, insect light traps, pumps other than the Daichi model where engine specs were not exact, herbicides/fungicides without comparable current listings, and the remaining seed and PPE catalogue entries.

SQL: `supabase/sql/pricing-batch-006.sql` (guarded updates + idempotent inserts; review branch only, not production). Existing product IDs, slugs and URLs remain unchanged; new variants have new stable IDs/slugs.


---

# Batch 7 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 1 |
| Price updates prepared | 7 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 92 |

Syngenta exclusion: Engeo 247SC 250ml. Danadim Progress is FMC/Cheminova (not Syngenta) and remains eligible; Funginil is Osho / Jiangsu Xinhe (not Syngenta) but requires a separate Kenya regulatory-status check.

## Price updates

| Product | Pack | Baseline Cost (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| fugo-chick-and-duckling-mash-50kg | Existing pack | 3,060 [RETAIL-ESTIMATE] | 30% | 4,000 | 3,600 (market avg 3,955) | https://ungafarmcare.com/; https://farmersbondealtd.co.ke/; https://agrijibu.co.ke/brand/fugo-feeds/ |
| fugo-fast-gro-broiler-finisher-pellets-50kg | Existing pack | 2,975 [RETAIL-ESTIMATE] | 30% | 3,850 | 3,500 (market avg 4,105) | https://ungafarmcare.com/; https://agrijibu.co.ke/brand/fugo-feeds/; https://www.myagrovet.co.ke/poultry-feeds |
| fugo-fast-gro-broiler-starter-crumbs-50kg | Existing pack | 3,145 [RETAIL-ESTIMATE] | 30% | 4,100 | 3,700 (market avg 4,168) | https://ungafarmcare.com/; https://farmersbondealtd.co.ke/; https://agrijibu.co.ke/brand/fugo-feeds/ |
| fugo-grower-mash-50kg | Existing pack | 2,890 [RETAIL-ESTIMATE] | 30% | 3,750 | 3,400 (market avg 3,423) | https://agrijibu.co.ke/fugo-grower-mash-50kg/; https://kilimokona.co.ke/shop/livestock-feed/layer-feeds/fugo-grower-mash-50kg-2/; https://farmersbondealtd.co.ke/ |
| evergrow-organic-fertilizer-50kg | Existing pack | 2,082.5 [RETAIL-ESTIMATE] | 30% | 2,700 | 2,450 (market avg 2,980) | https://mtolori.com/product/details/evergro-organic-50kgs-5173; https://simlaw.co.ke/product-details/1871/11020; https://agrijibu.co.ke/evergrow-organic-fertilizer-50kg/; https://agropests.com/products/evergrow-organic-fertilizer-npk-te-50-kg-1; https://shambamtaani.com/product/evergrow-organic-fertilizer-50-kg-100-organic-kebs-certified/ |
| falcon-npk-17-17-17-fertilizer-50kg | Existing pack | 4,547.5 [RETAIL-ESTIMATE] | 30% | 5,900 | 5,350 (market avg 5,350) | https://agrijibu.co.ke/crop-production/fertilizers/top-dressing-fertilizers/ |
| ear-tag-applicator | Existing pack | 1,432.25 [RETAIL-ESTIMATE] | 30% | 1,850 | 1,685 (market avg 1,742.5) | https://agrijibu.co.ke/; https://mkulimajovial.co.ke/price-list/ |

The FUGO feed reductions are supported by current manufacturer (Unga Farm Care), AgriJibu and local dealer listings. Existing FUGO prices for chick mash, finisher pellets, starter crumbs and grower mash were over 25% above the average of comparable current listings, so the reduction exception is met. Evergrow 50kg has multiple in-stock Kenyan retail observations from M-Tolori, Simlaw, AgriJibu, Agropests and Shamba Mtaani; current KSh4,699 is more than 25% above the market average, so the formula price KSh2,700 is permitted. ETG M401 was not reduced because its current price is not 25% above the multi-retailer average. Falcon NPK 17:17:17 and the ear-tag applicator are price increases based on in-stock listings.

## Regulatory/manual flags

- [REGULATORY CHECK] Funginil 720SC 40ml: PCPB chlorothalonil review materials list Funginil among products subject to withdrawal/review; do not treat the current listing as verified for sale until the current 2025 PCPB register and any subsequent decisions are checked. Price unchanged.
- Remaining items not updated because no exact in-stock Kenyan quote was found, the product specification did not match, or the formula price would require a reduction not permitted by the 25%-over-average guardrail. This includes Easygro products, Eazole, ECOMAX speakers, Econo rat stations, ED21 fly catcher, electric appliances, fertilizers without comparable exact stock, sprayers, household insecticides, other seeds, pesticide brands/pack sizes without current stock confirmation, FUGO Layer Compleat Meal (formula target below current but current not >25% above average), and livestock accessories.

No verified new pack sizes with exact current in-stock prices were confirmed for the other Batch 7 products. SQL: `supabase/sql/pricing-batch-007.sql` (guarded, review branch only; not applied to production). Existing slugs/URLs preserved.
