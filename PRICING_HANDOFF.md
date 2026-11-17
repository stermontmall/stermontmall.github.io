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
| Products with verified supplier price and price update prepared | 22 |
| Verified products already at the rounded markup price (no change needed) | 4 |
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
| 1056-Egg Fully Automatic Commercial Incubator | piece | 65,000 | 17.5% | 76,500 | https://ecochickspoultry.com/ |
| Abalone 18EC Insecticide 50ml | 50ml bottle | 145 | 30% | 200 | https://www.farmrescue.co.ke/product/abalone-18-ec |

| 4pcs Sticky Ribbon Fly Catcher Trap | pack of 4 | 450 | 30% | 600 | https://www.jumia.co.ke/green-sticky-ribbon-fly-catcher-trap-pack-of-4-132038852.html |

## Verified — no price change required

| Product Name | Supplier Price (KES) | Markup Tier | Correct Rounded Price (KES) | Current Website Price (KES) | Source |
|---|---:|---:|---:|---:|---|
| 13cm Air Stone for Fish Ponds | 2,000 | 30% | 2,600 | 2,600 | https://shop.mft.co.ke/air-stones-x-13cm |
| Accent 600SC Insecticide 50ml | 485 | 30% | 650 | 650 | https://www.farmrescue.co.ke/product/accent-600sc |

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
| Products with verified in-stock supplier price and price update prepared (after recheck) | 14 |
| Products flagged [NEEDS MANUAL PRICE CHECK] after recheck | 71 |
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

- `supabase/sql/pricing-batch-002.sql` — guarded SQL price changes for the 14 updated products.
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

**Batch 2 revised counts:** 100 scanned; 15 Syngenta exclusions; 14 unique price updates prepared (7 initial + 7 recheck, with the AICO sprayer counted once at its rechecked price); 71 still needing manual price checks; 0 new pack variants. No live database prices were changed.


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
| Needs manual check / unchanged | 93 |

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


---

# Batch 8 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 1 |
| Existing product prices prepared for update | 8 |
| New verified pack variants prepared | 7 |
| Needs manual price check / unchanged | 91 |

Syngenta exclusion: Icon 10CS mosquito insecticide. No other products in this batch were identified as Syngenta by brand/manufacturer.

## Existing product price updates

| Product | Pack | Baseline Cost (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| gearlock-turbo-250-wp-fungicide-1kg | Existing pack | 2,677.5 [RETAIL-ESTIMATE] | 30% | 3,500 | 3,150 (avg 3,385) | https://agroduka.ke/gearlock-turbo-250wp-1kg/; https://mtolori.com/product/details/gearlock-turbo-25-wp-1kg-17710933; https://agropests.com/products/gearlock-turbo-250-wp-1-kg; https://dawnfarmers.com/shop/crop-production/fungicides/gearlock-turbo-250wp-1kg/ |
| gradometer-480ec-termiticide-1-litre | Existing pack | 1,870 [RETAIL-ESTIMATE] | 30% | 2,450 | 2,200 (avg 2,227.5) | https://dawnfarmers.com/shop/crop-production/termiticides/gradometer-480ec-1-litre/; https://agrijibu.co.ke/gradometor-480ec/ |
| gradometor-480ec-termiticide-100ml | Existing pack | 297.5 [RETAIL-ESTIMATE] | 30% | 400 | 350 (avg 350) | https://agriguardagrovet.co.ke/product-category/termiticides/; https://agrijibu.co.ke/gradometor-480ec/ |
| guardian-bait-station-translucent-cover | Existing pack | 2,548.3 [RETAIL-ESTIMATE] | 30% | 3,300 | 2,998 (avg 3,249) | https://www.myagrovet.co.ke/products.php?id=5991; https://www.jumia.co.ke/catalog/?q=guardian+rodent+bait+station; https://www.kenagrosuppliers.co.ke/ |
| hisense-43a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-43-inch | Existing pack | 25,491.5 [RETAIL-ESTIMATE] | 30% | 33,150 | 29,990 (avg 31,745) | https://hisense.co.ke/; https://www.hotpoint.co.ke/; https://www.circuit.co.ke/ |
| hisense-55a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-55-inch | Existing pack | 36,465 [RETAIL-ESTIMATE] | 25% | 45,600 | 42,900 (avg 43,700) | https://hisense.co.ke/; https://www.hotpoint.co.ke/; https://www.circuit.co.ke/ |
| hisense-ref205dr-double-door-fridge-with-water-dispenser-205-litres | Existing pack | 32,129.15 [RETAIL-ESTIMATE] | 25% | 40,150 | 37,799 (avg 37,899) | https://www.hisensekenya.com/product/hisense-fridge-205-liters-grey; https://www.pricekenya.co.ke/c/refrigerators |
| haier-90l-single-door-direct-cool-fridge-black-90-litres | Existing pack | 17,786.25 [RETAIL-ESTIMATE] | 30% | 23,100 | 20,925 (avg 20,925) | https://haier.co.ke/product-category/fridge/ |

Gearlock Turbo 1kg is reduced because the existing KSh4,399 price is more than 25% above the average of Agroduka, M-Tolori, Agropests and Dawn Farmers (roughly KSh3,385); the formula-derived KSh3,500 is close to the market average. The other changes are increases from the exact matched in-stock listings and apply the 30% tier.

## Newly added pack variants

| Product | Pack | Lowest retail (KES) | Baseline (KES) | Markup | New price (KES) | Source |
|---|---|---:|---:|---:|---:|---|
| Golden Leaf Organosilicone Spray Adjuvant 25ml | 25ml bottle | 120 | 102 | 30% | 150 | https://mtolori.com/shop/details/29/products?page=156 |
| Golden Leaf Organosilicone Spray Adjuvant 50ml | 50ml bottle | 170 | 144.5 | 30% | 200 | https://mtolori.com/shop/details/29/products?page=156 |
| Golden Leaf Organosilicone Spray Adjuvant 100ml | 100ml bottle | 400 | 340 | 30% | 450 | https://mtolori.com/shop/details/29/products?page=156 |
| Golden Leaf Organosilicone Spray Adjuvant 250ml | 250ml bottle | 690 | 586.5 | 30% | 750 | https://mtolori.com/shop/details/29/products?page=156 |
| Gradometor 480EC Termiticide 50ml | 50ml bottle | 200 | 170 | 30% | 200 | https://agriguardagrovet.co.ke/product-category/termiticides/ |
| Gradometor 480EC Termiticide 500ml | 500ml bottle | 1,350 | 1,147.5 | 30% | 1,500 | https://agriguardagrovet.co.ke/product-category/termiticides/ |
| Gradometor 480EC Termiticide 5L | 5L bottle | 11,500 | 9,775 | 30% | 12,700 | https://agriguardagrovet.co.ke/product-category/termiticides/ |

Golden Leaf 1L already existed. M-Tolori's current Kenya list confirms 25ml KSh120, 50ml KSh170, 100ml KSh400, 250ml KSh690 and 1L KSh2,670; new 25ml/50ml/100ml/250ml pack rows are prepared. Golden Leaf 500ml and 20L sizes are listed by suppliers but no exact price was confirmed in this search, so they were not created.

Gradometor supplier listings confirm 50ml, 100ml, 250ml, 500ml, 1L, 5L and 20L packs. Existing 100ml, 250ml and 1L products remain; 50ml, 500ml and 5L are prepared using exact in-stock Kenya prices from AgriGuard. The existing 100ml/250ml/1L rows and new pack rows are grouped under one variant selector. The 20L price was not confirmed, so it is not added.

## Needs Manual Check

Remaining Batch 8 products not changed include GAUN imported livestock hardware where exact Kenyan stock pricing was not confirmed; foggers and Goizper sprayer; home appliances and electronics lacking model-exact current listings; other seeds without two matching supplier observations; Greenlife Farmchance (only one in-stock KSh14,000 source, so the current KSh18,200 is not reduced without the 25%-above-average test); Green Cop packs; Greenberg sprayers; Guardian alternatives where not exact; Hisense and Honda models without verified exact prices; PPE; bed bug products; Impact Dermi roller trap (calculated target below current, but current price is not >25% above multi-retailer average); and other unverified items. Golden Leaf 1L current price is retained because its formula target is below current and current is not >25% above the market average.

SQL: `supabase/sql/pricing-batch-008.sql` (guarded updates and inserts; review branch only, not production). All original slugs are preserved; newly added variants receive new stable slugs.


---

# Batch 9 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 2 |
| Price updates prepared | 7 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 91 |

Syngenta exclusions: Karate Zeon 5CS 100ml and 1L. K-Othrine is Bayer, Infinito is Bayer, and Katerina/Kenthalonil are not Syngenta; they are not excluded by brand. Katerina 720SC and Kenthalonil 720SC remain under a separate chlorothalonil regulatory check before any price update.

## Price updates

| Product | Pack | Baseline Cost (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| infinix-smart-20-4gb-64gb-20261108 | Existing pack | 12,546 [RETAIL-ESTIMATE] | 30% | 16,300 | 14,760 (avg 16,100) | https://www.jumia.co.ke/mlp-infinix-official-store/; https://acecore.co.ke/shop-phones; https://megastorekenya.co.ke/shop?brand=Infinix; https://silecommunications.com/product-category/infinix-mobile/ |
| infinix-hot-70-4gb-128gb-20261108 | Existing pack | 16,150 [RETAIL-ESTIMATE] | 30% | 21,000 | 19,000 (avg 20,323) | https://mobilehub.co.ke/product/infinix-hot-70?storage=4GB; https://www.priceinkenya.com/product/114082-infinix-hot-70; https://www.acecore.co.ke/shop-phones; https://www.jumia.co.ke/mlp-infinix-official-store/ |
| infinix-note-50-pro-8gb-256gb-20261108 | Existing pack | 25,075 [RETAIL-ESTIMATE] | 25% | 31,350 | 29,500 (avg 30,333) | https://www.phonetronicskenya.co.ke/categories/infinix; https://www.priceinkenya.com/price-list/phones/infinix; https://www.jumbomart.co.ke/categories/infinix-phones |
| integra-organo-silicone-spray-adjuvant-1l | Existing pack | 2,762.5 [RETAIL-ESTIMATE] | 30% | 3,600 | 3,250 (avg 3,275) | https://mtolori.com/product/details/integra-1ltr; https://agrijibu.co.ke/integra/ |
| kenpoly-4-litre-poultry-drinker | Existing pack | 297.5 [RETAIL-ESTIMATE] | 30% | 400 | 350 (avg 350) | https://www.myagrovet.co.ke/products.php?id=6997; https://ecochicks.co.ke/cat/poultry-equipment |
| kenpoly-4l-poultry-drinker-with-water-level-window | Existing pack | 297.5 [RETAIL-ESTIMATE] | 30% | 400 | 350 (avg 350) | https://myagrovet.com/product/large-4l-anti-spill-poultry-water-dispenser-all-birds; https://ecochicks.co.ke/cat/poultry-equipment |
| kato-germany-3-inch-7-5hp-petrol-water-pump | Existing pack | 15,300 [RETAIL-ESTIMATE] | 30% | 19,900 | 18,000 (avg 18,497.5) | https://juvalinnovations.co.ke/product/kato-germany-3-inch-petrol-water-pump/; https://colcalmachinery.co.ke/product-category/water-irrigation-equipment/petrol-water-pumps/ |

The Kato Germany 3-inch 7.5HP pump price reduction is permitted because the current KSh23,400 is more than 25% above the average of two comparable Kenyan listings (Juval KSh18,000; Colcal KSh18,995). The other changes are formula-derived increases or small corrections based on current in-stock Kenyan listings. The 4L Kenpoly drinker variants were reduced because the current prices were materially above the same exact Kenpoly 4L product listings at KSh350; the new KSh400 retains the 30% markup over the 85%-of-retail baseline.

The Infinix Smart 20 4GB/128GB listing was researched but not repriced: its calculated KSh15,800 is below the current KSh16,700, and the current price is not more than 25% above the multi-retailer average. It remains unchanged under the profit floor rule.

## Needs Manual Check / Regulatory

Remaining products are unchanged where no exact current Kenyan in-stock match was confirmed, or where the calculated price would require a reduction that does not meet the 25%-above-market-average exception. This includes Infinito 500ml/1L (current formula target below current but current not >25% above average), PPE, INGCO/Jacto sprayers and parts, pumps with non-matching engine/model specs, seeds without current multi-supplier checks, Katerina 720SC and Kenthalonil 720SC (chlorothalonil registration review), K-Othrine, household products, beekeeping equipment, and other hardware/electronics without a reliable exact match.

SQL: `supabase/sql/pricing-batch-009.sql` (guarded; review branch only, not applied to production). Existing slugs/URLs preserved.


---

# Batch 10 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta skipped | 3 |
| Existing product prices prepared for update | 6 |
| New pack variants prepared | 2 |
| Needs manual price check / unchanged | 91 |

Syngenta exclusions: Lumax 537.5SE Herbicide 5L, Maxim XL 035FS Seed Treatment 5L, and Miravis Duo 200SC 100ml.

## Price updates

| Product | Pack | Baseline Cost (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| levafas-diamond-fluke-and-worm-drench-1-litre | Existing pack | 1,445 [RETAIL-ESTIMATE] | 30% | 1,900 | 1,700 (avg 1,730) | https://www.melagri.com/brands/norbrook-kenya-limited; https://mtolori.com/product/details/levafas-diamond-1ltr-17867518 |
| lg-lhd657-1000w-5-1-channel-home-theatre-system-1000w-5-1-ch | Existing pack | 33,149.15 [RETAIL-ESTIMATE] | 25% | 41,450 | 38,999 (avg 44,619.25) | https://www.pricekenya.co.ke/p/lg-home-theatre-lhd657; https://www.avechi.co.ke/product/lg-lhd657-5-1ch-1000w-home-theatre-system/; https://www.kenyatronics.com/view-product/lg-lhd657-dvd-home-theater-system-1000w-51ch-bluetooth; https://www.incountrydistribution.co.ke/product/lg-lhd657-1000w-5-1-home-theatre/ |
| menno-florades-90sl-disinfectant-1l | Existing pack | 3,961 [RETAIL-ESTIMATE] | 30% | 5,150 | 4,660 (avg 4,660) | https://agriguardagrovet.co.ke/?action=yith-woocompare-add-product&id=1175 |
| menno-florades-90sl-disinfectant-250ml | Existing pack | 1,062.5 [RETAIL-ESTIMATE] | 30% | 1,400 | 1,250 (avg 1,275) | https://agropests.com/products/menno-florades-90sl-250ml; https://agriguardagrovet.co.ke/?action=yith-woocompare-add-product&id=1175 |
| matco-72wp-fungicide-1kg | Existing pack | 1,547 [RETAIL-ESTIMATE] | 30% | 2,000 | 1,820 (avg 2,075) | https://mtolori.com/shop/details/1/products?page=36; https://www.farmrescue.co.ke/product/matco-72-wp |
| matco-72wp-fungicide-500g | Existing pack | 765 [RETAIL-ESTIMATE] | 30% | 1,000 | 900 (avg 1,088.75) | https://mtolori.com/shop/details/1/products?page=36; https://kuzaagrochem.com/products/matco-72wp-500g-624; https://agriguardagrovet.co.ke/product/matco-72-wp/; https://www.farmrescue.co.ke/product/matco-72-wp |

The LG LHD657 1000W 5.1-channel home theatre update is based on four current Kenyan listings; KSh38,999 is the lowest. Levafas Diamond 1L is reduced because the current KSh2,450 is over 40% above the average of two current Kenyan listings (KSh1,700 and KSh1,760); formula price is KSh1,900. Matco 1kg and 500g are reduced because their current prices are more than 25% above multiple exact-pack listings. Menno Florades 1L and 250ml are increases using the verified AgriGuard/Agropests current retail listings.

## New pack variants

| Product | Pack | Lowest retail (KES) | Baseline (KES) | Markup | New price (KES) | Source |
|---|---|---:|---:|---:|---:|---|
| Levafas Diamond Fluke & Worm Drench 125ml | 125ml bottle | 380 | 323 | 30% | 400 | https://www.melagri.com/brands/norbrook-kenya-limited |
| Levafas Diamond Fluke & Worm Drench 500ml | 500ml bottle | 1,000 | 850 | 30% | 1,100 | https://www.melagri.com/brands/norbrook-kenya-limited |

Mel-Agri's current Norbrook Kenya catalogue shows Levafas Diamond 125ml (KSh380), 500ml (KSh1,000) and 1L (KSh1,700), all in stock. Existing 1L remains; new 125ml and 500ml variants are prepared. The three packs are grouped in a variant selector. No other pack additions were made because exact prices/stock could not be verified.

## Needs Manual Check / Regulatory

Remaining Batch 10 products unchanged where no exact current price was verified or the formula price would require an impermissible reduction. This includes vehicle sourcing adverts, PPE, livestock premix and supplements, longray foggers, household appliances and personal care, Lynfield traps, fertilizers, Matco pack sizes where formula target is below current but current is not sufficiently overpriced, Mavuno Bora bags, MaxGuard moth traps, Maxigrow, Maxim excluded as Syngenta, Mchwatox, Milano pumps, other fungicides and insecticides, men’s fashion, Metro 200SC, Milestone, milk strip cup, mini feed crusher, rodent baits, MOP fertilizer, mosquito consumables and Mospilan.

SQL: `supabase/sql/pricing-batch-010.sql` (guarded updates and idempotent inserts; review branch only, not production). Existing slugs/URLs preserved.


---

# Batch 11 — products 1001–1100 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 3 |
| Price updates prepared | 6 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 91 |

**Syngenta exclusions:** Orondis Ultra 28SC 25ml, Orondis Ultra 280SC 100ml, and Ortiva 250SC 20ml. These are left untouched.

## Price updates prepared

| Product | Pack Size | Supplier Baseline (KES) | Markup Tier | New Website Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| omron-m1-basic-automatic-upper-arm-blood-pressure-monitor-22-32-cm-cuf | exact listed pack | 3,570 [RETAIL-ESTIMATE] | 30% | 4,650 | 4,200 (multi-retailer avg 4,600) | https://comfyshc.com/product/omron-m1-basic-blood-pressure-monitorwith-warranty/; https://medpoint.co.ke/product/omron-m1-basic-blood-pressure-monitor/; https://hinatapharmacy.co.ke/products/omron-blood-pressure-machine-m-1 |
| norbrook-milking-salve-100-g | exact listed pack | 102 [RETAIL-ESTIMATE] | 30% | 150 | 120 (multi-retailer avg 135) | https://mtolori.com/product/details/milking-salve-100gms-norbrook-3570; https://www.melagri.com/brands/norbrook-kenya-limited |

Both are [RETAIL-ESTIMATE] baselines, not wholesale quotes. Omron M1 Basic lowest in-stock Nairobi listing is KSh4,200, with Medpoint Nairobi KSh4,500 and Hinata Pharmacy KSh5,100; average KSh4,600. Baseline KSh3,570 × 1.30 = KSh4,641, rounded to KSh4,650. Existing KSh6,499 was over 25% above the multi-retailer average. Norbrook Milking Salve 100g lowest comparable Kenyan price KSh120 at M-Tolori, with Mel-Agri KSh150 in stock; baseline KSh102 × 1.30 = KSh132.60, rounded KSh150. Existing KSh450 was materially more than 25% above the multi-retailer average. Both new prices retain at least the 15% profit floor and are close to the observed retail market.

## Other checked / unchanged

- Termidor 96SC 1L: current KSh20,850; listings include M-Tolori KSh15,500, Farm Rescue KSh16,025, Cheapthings KSh19,500, Jumia KSh24,000 and FarmShield KSh28,899. Existing price is not >25% above the comparable-market average; do not reduce. Termidor 200ml has inconsistent seller pricing and is retained.
- Osho Hillor HR14: Osho direct KSh14,116 and Agroduka KSh15,448 in stock; current KSh18,399 is close to the >25% reduction boundary but not over the market average threshold, so unchanged.
- Osho Deluxe Bucket Sprayer: Osho direct KSh9,366 and Agroduka KSh10,250; current KSh12,199 does not exceed the average by >25%, so unchanged.
- Omex Calmax 1L: M-Tolori KSh1,060; only one exact current listing, so unchanged.
- Ozoneem 1% EC 1L: Agroduka KSh37,020 in stock (minimum quantity 4); no second comparable independent listing, so unchanged.
- Nimbecidine 1L and Bio-Nematon 1L pack selectors display broad price ranges; no pack-specific exact price is safely extractable, so unchanged.
- Omnia Potassium Nitrate 13:0:46 25kg: M-Tolori KSh7,760; insufficient independent exact-pack evidence to change current price.

## Needs Manual Price Check

All other non-Syngenta records in this batch remain unchanged pending exact-pack supplier verification, including moth traps, DIY fly screens, mouse/rat traps, Multi NPK 13-2-44, Murtano, spray gun atomizer, Nativo SC, Navigator, Neemazal, Neocidol, Nexal, footwear, Nilzan Plus, Nivea items, teat dip cup, Nordox packs, Novital drinkers, respirator, NPK 23:23:0, Nunix appliances, Nutrifol, nitrile gloves, Odyssey seeds, Olvet drench, Omex Calmax, Omnia potassium nitrate, Oppo phones, Optimizer, Oraimo electronics/accessories, Oreganum seeds, Philips starter/tubes, Termidor where exact comparison/stock is inconsistent, Orvego, Osefin, Osho Bio Magic, Bio-Nematon, Osho bucket sprayers, Halt Neo, Nimbecidine, Oshothane, watches, Ozoneem, Pali, Panthenon, pantry moth trap, Papaya/Parsley seeds, Pearl, Pegasus packs, Pentagon, Pestman gel, Pestoptek stations, maize sheller, thermal fogger, PH1 seeds and other remaining catalogue records from this 100-row segment.

Nimbecidine/Bio-Nematon sizes are not added because pack-specific exact prices were not exposed. Oshothane variants are added in the research addendum below. Existing slugs/canonical URLs preserved.

**SQL:** `supabase/sql/pricing-batch-011.sql` — guarded review-branch update, not applied to production. The product page generator has Product Offer KES pricing, availability, one-year priceValidUntil and hash-based per-URL sitemap lastmod generation; run the product build after applying catalogue SQL to refresh JSON-LD and sitemap files.


## Batch 11 pricing and pack-size research addendum

Four additional prices are now included in the guarded Batch 11 SQL:

| Product | Pack | Baseline Cost (KES) | Markup Tier | New Website Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| OPPO A5 Pro 4G 8GB/256GB | 1 piece | 23,375 [RETAIL-ESTIMATE] | 25% | 29,200 | 27,500–27,700 (avg 27,600) | https://smartlinkelectronics.co.ke/shop?brand=oppo&category=phones; https://www.phonetronicskenya.co.ke/search?query=oppo+a5+pro |
| Oraimo BoomPop Lite OHP-317 | 1 piece | 2,550 [RETAIL-ESTIMATE] | 30% | 3,300 | 3,000–3,500 (avg 3,166) | https://phonekenya.co.ke/brand/oraimo; https://www.sialophones.com/oraimo; https://goldec.co.ke/brand/oraimo |
| Oraimo Watch 5 Lite OSW-804 | 1 piece | 2,125 [RETAIL-ESTIMATE] | 30% | 2,750 | 2,500 | https://www.sialophones.com/oraimo |
| Oshothane 80 WP | 50g | 76.50 [RETAIL-ESTIMATE] | 30% | 100 | 90 | https://www.farmrescue.co.ke/product/oshothane-80-wp |

### Six additional Oshothane pack variants

Farm Rescue lists all sizes below in stock with exact pack prices. Baseline = supplier retail × 0.85.

| Product | Pack | Supplier Price (KES) | Baseline (KES) | Markup | New Price (KES) | Source |
|---|---|---:|---:|---:|---:|---|
| Oshothane 80 WP Fungicide | 100g | 150 | 127.50 | 30% | 150 | https://www.farmrescue.co.ke/product/oshothane-80-wp |
| Oshothane 80 WP Fungicide | 200g | 265 | 225.25 | 30% | 300 | https://www.farmrescue.co.ke/product/oshothane-80-wp |
| Oshothane 80 WP Fungicide | 500g | 595 | 505.75 | 30% | 650 | https://www.farmrescue.co.ke/product/oshothane-80-wp |
| Oshothane 80 WP Fungicide | 1kg | 1,180 | 1,003 | 30% | 1,300 | https://www.farmrescue.co.ke/product/oshothane-80-wp |
| Oshothane 80 WP Fungicide | 2.5kg | 2,915 | 2,477.75 | 30% | 3,200 | https://www.farmrescue.co.ke/product/oshothane-80-wp |
| Oshothane 80 WP Fungicide | 5kg | 5,740 | 4,879 | 30% | 6,350 | https://www.farmrescue.co.ke/product/oshothane-80-wp |

The new Oshothane pack rows use the existing category, stock default (1,000), low-stock alert (20), featured flag, KES prices, metadata, and a shared variant group. Existing 50g product slug is preserved and joined to the new pack selector. No other variants were created without a precise pack price and stock confirmation.


---

# Batch 12 — products 1101–1200 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta excluded | 4 |
| Existing products with price updates | 10 |
| New pack variants prepared | 4 |
| Remaining manual price check / unchanged | 86 |

**Syngenta exclusions (untouched):** Pirimor 50WG 1kg, Primagram Gold 660SC 5L, Quadris 50WG 1kg, and Quadris 50WG 20g. PCPB/Syngenta references confirm the relevant brand/manufacturer. Radiant 120SC is a Dow/Corteva product, Prequel 720WP is sold by Osho and is not treated as Syngenta, and Previcur Energy is Bayer.

## Existing product price updates

| Product | Pack | Baseline (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| Pioneer 30G19 2kg | 2kg / 25L | 722.50 [RETAIL-ESTIMATE] (lowest retail 850) | 30% | 950 | 900–1,000 | https://www.mtolori.com/product/details/maize-pioneer-30g19-2kg-3647; https://www.melagri.com/products/pioneer-30-g19-hybrid-maize-seeds--gq5eaisrGjR5uY4uTo5n; https://agrijibu.co.ke/brand/pioneer-seeds/; https://agropests.com/products/pioneer-30-g19-maize-2-kg |
| Pioneer P2848W 2kg | 2kg / 25L | 722.50 [RETAIL-ESTIMATE] (lowest retail 850) | 30% | 950 | 900–950 | https://mtolori.com/product/details/maize-pioneer-p2848w-2kg-2416; https://www.melagri.com/brands/corteva-agroscience; https://agrijibu.co.ke/pioneer-p2848w-maize-seeds-2kg/; https://agropests.com/products/pioneer-p2848w-maize-2kg |
| Pioneer P3812W 2kg | 2kg / 25L | 722.50 [RETAIL-ESTIMATE] (lowest retail 850) | 30% | 950 | 900–1,000 | https://www.mtolori.com/shop/details/1/products?page=16; https://www.melagri.com/brands/corteva-agroscience; https://agrijibu.co.ke/brand/pioneer-seeds/ |
| Premier 767 25L 2-stroke | 2kg / 25L | 11,899.15 [RETAIL-ESTIMATE] (lowest retail 13,999) | 30% | 15,450 | 13,999–15,000 | https://kitalisuppliersltd.com/products/premier-engine-sprayer-model-767-%E2%80%93-25l-heavy-duty-two-stroke-knapsack-sprayer; https://deveronig.co.ke/product/premier-engine-sprayer-model-767-25l-2-stroke-petrol-knapsack-sprayer-for-farming-ksh-14499/; https://www.myagrovet.co.ke/products.php?id=7513; https://njunexpowertools.co.ke/product-category/agricultural-appliances/ |

These are [RETAIL-ESTIMATE] baselines (lowest matched in-stock retail × 0.85), not wholesale quotations. Pioneer seed current prices exceeded multiple comparable supplier observations by more than 25%; new prices are based on the lowest listed 2kg price KSh850, baseline KSh722.50, 30% markup and KSh50 rounding. Premier 767 25L 2-stroke has four distinct Kenyan listings from KSh13,999 to KSh15,000; baseline KSh11,899.15, 30% markup, rounded to KSh15,450. Its current KSh19,500 is more than 25% above the comparable market average. The new prices retain the required profit floor and are within approximately 10% of the comparable prices.

## New pack variants prepared

| Product | Pack | Baseline (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| Premise 200 SC Termiticide | 250ml | 5,014.15 [RETAIL-ESTIMATE] | 30% | 6,500 | 5,899 | https://imaginecare.co.ke/product/premise-200-sc-250-ml/; https://agriguardagrovet.co.ke/product/premise-200-sc/; https://agropests.com/products/premise-200-sc-termiticide-250ml; https://www.nunuza.shop/products/premise-200sc-insecticide-termicide-250ml-2dTDAjsENgsbgy381E7GQf |
| Prequel 720 WP Fungicide | 120g | 280.50 [RETAIL-ESTIMATE] | 30% | 350 | 330 | https://www.farmrescue.co.ke/product/prequel-720-wp |
| Prequel 720 WP Fungicide | 500g | 1,156 [RETAIL-ESTIMATE] | 30% | 1,500 | 1,360 | https://www.farmrescue.co.ke/product/prequel-720-wp |
| Prequel 720 WP Fungicide | 1kg | 2,256.75 [RETAIL-ESTIMATE] | 30% | 2,950 | 2,655 | https://www.farmrescue.co.ke/product/prequel-720-wp |

Premise 200SC 250ml is confirmed in stock at multiple Kenyan suppliers; lowest reliable current listing KSh5,899 from Imagine Care (143 ratings), with AgriGuard KSh6,500, Agropests KSh6,900 and Nunuza KSh6,500. Retail-estimate baseline KSh5,014.15 × 1.30 = KSh6,518, rounded KSh6,500. New pack is grouped with existing Premise 50ml and 1L variants. The image field is intentionally empty rather than reusing a photo of the wrong bottle size.

Prequel 720WP packs 120g, 500g and 1kg are explicitly listed in stock by Farm Rescue at KSh330, KSh1,360 and KSh2,655. Formula-derived prices are KSh350, KSh1,500 and KSh2,950 respectively. The existing 40g listing is attached to a shared variant group; its slug remains unchanged. The new pack image fields are empty until exact pack photos are available.

## Needs Manual Price Check / unchanged

The remaining non-Syngenta products in rows 1101–1200 stay unchanged pending reliable exact-match data: Piano F1 spinach seed 5g, Pirimor (excluded), PPE overalls, Plant Soul Zinc Phosphite, plastic poultry mesh (single independent price observation; duplicate listings are not treated as separate sources), gel syringe plunger, POCO phones, Polti Cimex Eradicator, Polyfeed 1kg, Polysil 25ml, Popvet dewormer, portable thermal fogger, Bluetooth speaker, poultry dust, Power King extension cable, power tiller, Powermate water pump (single reliable listing), Premier pump models other than the specifically benchmarked 10HP 100m 3-phase unit, Premier 767 4-stroke, Premise 1L and 50ml (no reduction justified by the multi-retailer average), Prequel 40g (existing pack already close to formula), Previcur Energy, professional grafting kit, Promax variants, Protecta Micro bait station, footwear, Punisher products, PVC apron and wire mesh, Pyramid Trek repellent, Quadris (excluded), rabbit drinking pipe, Radiant 120SC, radish seeds, Rafiki fly/rattrap products, magnetic mosquito screen, insect mesh, Raid liquid/refills, Ralon, Ramtons appliances where only one exact current price or insufficient same-model comparisons were found, and all other rows in this batch not listed in the price-update tables.

No additional variants were created beyond the four above. Existing product slugs/canonical URLs are preserved. Price updates and inserts are guarded SQL in `supabase/sql/pricing-batch-012.sql`; they are review-branch changes only and are not live until the SQL is applied. The product generator includes KES Offer schema and one-year `priceValidUntil`, and sitemap hash logic updates `lastmod` only when the generated product HTML changes; rebuild after applying the SQL to sync JSON-LD and sitemap files.


### Additional Batch 12 price updates — broader model-specific research

| Product | Pack | Baseline (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| PH1 Maize Seeds | 2kg | 552.50 [RETAIL-ESTIMATE] | 30% | 700 | 650 | https://agrijibu.co.ke/seeds/cereals-seeds/page/2/ |
| Promax 20EC Insecticide | 1L | 5,100 [RETAIL-ESTIMATE] | 30% | 6,650 | 6,000 | https://agropests.com/products/promax-20-ec-1-l |
| Ramtons RM/399 Electric Kettle | 1.7L | 959.65 [RETAIL-ESTIMATE] | 30% | 1,250 | 1,129–2,350 (7 shops) | https://www.pricekenya.co.ke/p/ramtons-kettle-1-7l; https://dealmtaani.co.ke/home-appliances/small-appliances/kettles/ramtons-rm-399-corded-electric-kettle; https://www.carrefour.ke/mafken/en/small-appliances/n/c/clp_NFKEN4040000 |
| Ramtons RM/458 Microwave | 20L | 6,799.15 [RETAIL-ESTIMATE] | 30% | 8,850 | 7,999–8,700 | https://www.ramtons.com/small-home-appliances; https://generationspace.co.ke/home-personal-electronics-deals/; https://www.jumia.co.ke/mlp-ramtons-official-store/ |
| Ramtons RM/553 Wet & Dry Vacuum | 21L | 8,074.15 [RETAIL-ESTIMATE] | 30% | 10,500 | 9,499–13,199 | https://www.ramtons.com/small-home-appliances; https://www.jumia.co.ke/mlp-ramtons-official-store/; https://overtech.co.ke/store/ramtons/page/5/ |
| Ramtons RM/580 Blender + Mill | 1.5L | 4,220.25 [RETAIL-ESTIMATE] | 30% | 5,500 | 4,965–7,749 | https://www.ramtons.com/small-home-appliances; https://www.carrefour.ke/mafken/en/small-appliances/n/c/clp_NFKEN4040000; https://denfatechelectronics.com/product-category/kitchen-home-appliances/; https://www.digitalstore.co.ke/collections/vendors?page=14&q=ramtons |

The four Ramtons reductions are supported by multiple exact-model retail observations and the existing price is more than 25% above the market average. PH1 and Promax are increases using exact pack listings. All six changes have expected-price guards and update the estimated cost baseline in the same SQL transaction.

**Corrected Syngenta count:** Quadris 50WG 20g is also a Syngenta product and is included in the 4-SKU exclusion total; it remains untouched.


---

# Batch 13 — products 1201–1300 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 8 |
| Existing product prices updated | 7 |
| New pack variants prepared | 3 |
| Needs manual price check / unchanged | 85 |

**Syngenta exclusions (untouched):** Revus 250SC 1L and 100ml; Ridomil Gold MZ 68WG 1kg, 250g and 50g; Score 250EC 20ml and 1L; Servian 75WG 50g. These are confirmed by Syngenta's Kenya product catalogue and/or Syngenta vendor branding. Ransom 600WP is a Greenlife Crop Protection product, not Syngenta; Ranger 480EC is a Greenlife product, and Real IPM lines are not Syngenta.

## New pack variants prepared — Ransom 600WP

| Product | Pack | Supplier retail (KES) | Baseline (KES) | Markup | New website price (KES) | Competitor retail (KES) | Source |
|---|---|---:|---:|---:|---:|---:|---|
| Ransom 600 WP Fungicide | 100g | 475 | 403.75 | 30% | 525 | 475 | https://www.farmrescue.co.ke/product/ransom-600-wp |
| Ransom 600 WP Fungicide | 250g | 880 | 748.00 | 30% | 950 | 880 | https://www.farmrescue.co.ke/product/ransom-600-wp |
| Ransom 600 WP Fungicide | 1kg | 3,245 | 2,758.25 | 30% | 3,600 | 3,245 | https://www.farmrescue.co.ke/product/ransom-600-wp |

All three are [RETAIL-ESTIMATE] baselines (exact in-stock Kenyan retail × 0.85), not wholesale quotes. Formula outputs are rounded to KSh50. The existing 30g product remains at KSh150; Farm Rescue lists it at KSh145, and the formula-derived price rounds to KSh150. The 30g listing is attached to a shared Ransom variant group without changing its slug. New variants have blank image arrays until exact pack photos can be obtained; no wrong-size product image is reused.

## Verified / unchanged observations

- Raptor 1.92EC 50ml: M-Tolori KSh250; current KSh350. Single supplier observation only; no reduction without a defensible multi-retailer market average.
- Raptor 1.92EC 100ml: M-Tolori KSh460; current KSh599. Single supplier observation only; unchanged.
- Mazao Campaign 1L: Agroduka KSh12,000 in stock vs current KSh15,600; one exact supplier observation, so unchanged.
- Mazao Regain 1L: Agroduka KSh1,800 in stock vs current KSh2,350; one exact supplier observation, so unchanged.
- Mazao Sustain 1L: Agroduka KSh2,400 in stock vs current KSh3,150; one exact supplier observation, so unchanged.
- Rebune 20W insect killer: Homelux KSh5,200 listing is backordered, so not used as an in-stock baseline.
- Urea 46% N 50kg: Mkulima Supply Store KSh3,500, FarmShield KSh4,800, Dawn Farmers KSh5,400; current KSh4,450 is within the observed market range and not >25% above the average. Formula would be lower than current, so retain the existing price under the reduction guard.
- Ranger 480EC pack range is listed by Chemsasa, but the returned page does not unambiguously map prices to exact packs; do not add speculative pack variants.

## Needs Manual Price Check / unchanged

All other non-Syngenta products in this 100-row segment remain unchanged pending exact pack/stock confirmation, including household appliances, vehicle sourcing advert, Ranger 480EC 1L, Ransom 30g (verified and already near formula price), Raptor 50ml/100ml, Rashnik blender, rat traps and baits, Real IPM Mazao products, Rebune 20W lamp, rechargeable mosquito rackets, Red Top fly trap, Redmi earbuds, footwear, PPE vest, Reliable Amito 100g/250g, Rentokil glueboards, mosquito mesh, Resolve 6 dust, egg tray, Rimeta Gold, tomato seeds, Riomax, Roch microwave, rodent baits, Rootex, Urea, Russell IPM glue rolls, Ryobi sprayers, aerosol dispenser, SAAF packs, basil seeds, salinomycin feed additive, Samsung devices, SanDisk drive, maize seeds, Score (excluded), poultry nipple, Segatron, Selecta sprayers, screen repair tape, sorghum seeds, Sevin dust, tracksuits, UV tubes, livestock tags, Shenke mats, Shotgun, pepper seeds, Skilltech mount, Skipper, Skyworth TV, household drinkware, snail control, snake tongs, soil tester, wasp traps, Solo sprayers, Solubor and all other remaining rows not listed above.

No additional packs were created except the three Ransom sizes with explicit in-stock prices. Existing slugs/canonical URLs are preserved. SQL: `supabase/sql/pricing-batch-013.sql` (review branch only; not applied to production). Product JSON-LD and sitemap files need the product build after SQL application; the generator sets KES offer price from catalogue data, includes one-year priceValidUntil and updates per-URL sitemap lastmod on changed generated HTML.


## Additional Batch 13 price updates — Samsung, Seed Co and Rootex

| Product | Pack | Baseline (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| samsung-galaxy-a06-4gb-ram-plus-64gb-4gb-plus-64gb | Current pack | 12,409.15 [RETAIL-ESTIMATE] | 30% | 16,150 | 14,599 (avg 15,500) | https://www.jumia.co.ke/mlp-samsung-store/; https://mobix.co.ke/product-category/affordable-samsung-phones-pricing-kenya/; https://www.samsungbrandstore.co.ke/category/galaxy-a-series |
| samsung-galaxy-a07-5g-4gb-128gb-20261108 | Current pack | 19,131.8 [RETAIL-ESTIMATE] | 30% | 24,850 | 22,508 (avg 22,553.5) | https://www.jumia.co.ke/mlp-samsung-store/; https://www.jumia.co.ke/samsung/ |
| samsung-galaxy-a17-5g-4gb-128gb-20261108 | Current pack | 19,131.8 [RETAIL-ESTIMATE] | 30% | 24,850 | 22,508 (avg 22,553.5) | https://www.jumia.co.ke/mlp-samsung-store/; https://www.jumia.co.ke/samsung/ |
| samsung-galaxy-a26-5g-8gb-256gb-20261108 | Current pack | 30,600 [RETAIL-ESTIMATE] | 25% | 38,250 | 36,000 (avg 36,000) | https://infinitetech.co.ke/samsung-galaxy-a-series-price-tracker-kenya-october-2026/ |
| samsung-43u8000f-crystal-uhd-4k-smart-tv-43-inch | Current pack | 32,215 [RETAIL-ESTIMATE] | 25% | 40,250 | 37,900 (avg 40,600) | https://www.samsungbrandstore.co.ke/category/4k-uhd-led-tvs; https://hisenseke.co.ke/product/samsung-43-inch-4k-hdr-smart-led-tv/; https://megastorekenya.co.ke/product/samsung-43u8000-43-inch-u8000-series-crystal-uhd-4k-smart-tv |
| sc-duma-43-hybrid-maize-seeds-2kg | Current pack | 765 [RETAIL-ESTIMATE] | 30% | 1,000 | 900 (avg 900) | https://agrijibu.co.ke/brand/seed-co/ |
| rootex-6-rooting-hormone-50-g | Current pack | 442 [RETAIL-ESTIMATE] | 30% | 550 | 520 (avg 690) | https://mtolori.com/product/details/rootex-50gm-302; https://agriguardagrovet.co.ke/product/rootex-6dp-organic-50g/; https://www.jumia.co.ke/osho-rootex-6dp-rooting-hormone-powder-50grams-166739929.html |

Samsung A06, A07 5G and A17 5G use exact RAM/storage/network configurations from Jumia's Samsung Official Store and Kenyan retailer listings. Samsung A26 5G 8GB/256GB uses the October 2026 Kenya model-specific price tracker. Samsung 43U8000F is benchmarked against Samsung Brandstore, a Kenyan retailer with stock, and Mega Store. Rootex 6 50g is repriced to KSh550 using M-Tolori KSh520, AgriGuard KSh600 and the in-stock Jumia listing; the current KSh1,099 is more than 25% above the market average. SC Duma 43 2kg is a small formula-based increase from AgriJibu's KSh900 listing.


---

# Batch 14 — products 1301–1400 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 8 |
| Existing products with price updates | 12 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 80 |

**Syngenta exclusions (untouched):** Syngenta Tatua Rat & Mice Poison Blocks; Tatua Advion Cockroach Gel 30g; Tatua Advion 4 × 30g; Tatua Demand 10CS 25ml; Tatua Klerat 100g; Tatua Zyrox Fly Bait 500g; Tervigo 020SC 5L; Thiovit Jet 1kg. PCPB and vendor/brand references confirm Syngenta ownership/registration. Tihan OD175 is Bayer, Taurus 500SP is Greenlife, and Thunder OD145 is Bayer, so those are not excluded.

## Prepared price updates

| Product | Pack | Baseline (KES) | Markup | New Website Price (KES) | Competitor Retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| Spirometer 500SC | 100ml | 1,317.50 [RETAIL-ESTIMATE] | 30% | 1,700 | 1,550 (Agropests, AgriGuard, Kuza) | https://agropests.com/products/spirometer-500-sc-100ml; https://agriguardagrovet.co.ke/; https://kuzaagrochem.com/products/spirometer-100ml-840 |
| Taurus 500SP | 1kg | 4,462.50 [RETAIL-ESTIMATE] | 30% | 5,800 | 5,250–6,400 | https://www.mtolori.com/product/details/taurus-500sp-1kg-2274; https://agriguardagrovet.co.ke/product/taurus-500-sp/ |
| Systema 50EC | 1L | 2,550 [RETAIL-ESTIMATE] | 30% | 3,300 | 3,000–3,250 | https://agropests.com/products/systema-50-ec-1-l; https://kuzaagrochem.com/products/systema-50ec-1l |

| Symnet 50-mesh insect net | 3m × 50m roll | 12,750 [RETAIL-ESTIMATE] | 30% | 16,600 | 15,000 | https://www.symnet.co.ke/solutions/insect-nets |

All four use [RETAIL-ESTIMATE] baselines (lowest reliable in-stock Kenyan retail × 0.85), not wholesale quotes. Prices are rounded to nearest KSh50. Existing-price reductions are justified by multiple comparable listings showing current price >25% above market average: Spirometer 500SC 100ml (KSh1,550 at Agropests, AgriGuard and Kuza; new KSh1,700), Taurus 500SP 1kg (M-Tolori KSh5,250 and AgriGuard KSh6,400; new KSh5,800), and Systema 50EC 1L (Agropests KSh3,000 and Kuza KSh3,250; new KSh3,300). Samsung 43U8000F is assigned to Batch 13 and is not counted again here. Symnet 50-mesh 3m × 50m roll is increased from KSh15,499 to KSh16,600 using Symnet's own exact-size in-stock KSh15,000 listing as the retail baseline (retail estimate × 0.85). This puts Stermont 10.7% above that one supplier's retail price, below the 15% alert threshold; one source only, so this is a single-observation baseline rather than a competitor average.

## Verified / unchanged and manual checks

- Solubor 5kg: Agropests KSh3,200 in stock, but no second independent exact-pack current listing; no reduction under the multiple-comparator guard.
- Sulban 48EC 1L: Agroduka KSh1,479 is out of stock; Jojemi shows a pack-price range but no exact 1L value. Retained.
- Stopdew 250WP 1kg: AgriGuard KSh2,370; no second exact-pack current listing, so retained.
- Tehno Mss drinker/feeder listings were compared with MyAgrovet, Mkulima Jovial and Fuga. Generic capacities and lookalike listings are not treated as exact same-brand/model observations. No speculative changes to 1.5L, 3L, 6L, 8L, 9L, 10L drinkers or 1.5kg/4kg/6kg/9kg/12kg feeders.
- Solum H20, Solumest Iron EDDHA, Super Boron Extra, Super Gro, Super Nitro Humix: exact pack-level prices or independent in-stock comparisons are incomplete; unchanged.
- Household Sonar appliances, STEM kits, pigeon spikes, milking bucket, secateurs, Stargem, safety boots, mosquito nets, Stop Vermin, Storm Block, Stuf-It mesh, Sulphate of Potash, sweep net, Symnet garden, Systema, UV tubes, Tajiri, Tatua (excluded), Taurus, TCL 75C6K, Tecamin, TECNO phones, Tecto, rabbit/poultry equipment, Tervigo/Thiovit (excluded), Thunder, Tihan, Token, Tolsen/Total pumps and sprayers, tomato/spinach seeds, and remaining items are unchanged where exact model/pack price evidence did not justify a safe change.

No new pack sizes were added: supplier pages for Sulban, Stopdew, Taurus, Solubor and Spirometer list further packs, but exact in-stock prices were unavailable or variants were out of stock. Do not create pack variants based on size-only evidence. Existing slugs/canonical URLs remain unchanged.

**SQL:** `supabase/sql/pricing-batch-014.sql` — guarded branch-only updates, not applied to production. Product JSON-LD and sitemap refresh require applying catalogue SQL and running the product build; the generator reads KES prices from product records, includes availability and one-year `priceValidUntil`, and updates sitemap `lastmod` for generated pages whose HTML changes.


---

# Batch 15 — products 1401–1500 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 0 |
| Existing products with price updates prepared | 15 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 85 |

No Syngenta product lines were identified in this batch. Trinity Gold 452WP is Greenlife; Trustmate is Greenlife; the Tronic units are locally distributed electrical insect killers; TVS items are motorcycle spare parts.

## Prepared price updates

| Product | Pack / model | Baseline (KES) | Markup Tier | New Website Price (KES) | Competitor Retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| trinity-gold-452wp-fungicide-5kg | exact catalogue pack/model | 7,301.5 [RETAIL-ESTIMATE] (lowest 8,590) | 30% | 9,500 | 9,499–10,635 | https://agropests.com/products/trinity-gold-452wp-5kg; https://imaginecare.co.ke/product-tag/trinity-gold-452wp/; https://www.farmrescue.co.ke/product/trinity-gold-452-wp |
| tronic-ik-7011-10-10w-uv-a-insect-killer | exact catalogue pack/model | 3,187.5 [RETAIL-ESTIMATE] (lowest 3,750) | 30% | 4,150 | 3,750–3,800 | https://www.tronic.co.ke/products/tronic-insect-killer-10w-1-tube; https://shopit.co.ke/insect-killers/ |
| tronic-ik-7011-15-15w-uv-a-insect-killer | exact catalogue pack/model | 3,485 [RETAIL-ESTIMATE] (lowest 4,100) | 30% | 4,550 | 3,800 ex-VAT / 4,100 Tronic | https://www.tronic.co.ke/collections/insect-killer; https://shopit.co.ke/insect-killers/ |
| tronic-ik-7039-20-20w-eco-friendly-insect-killer | exact catalogue pack/model | 4,335 [RETAIL-ESTIMATE] (lowest 5,100) | 30% | 5,650 | 5,100 | https://www.tronic.co.ke/collections/insect-killer |
| tronic-ik-ga80-80w-commercial-insect-killer | exact catalogue pack/model | 25,474.5 [RETAIL-ESTIMATE] (lowest 29,970) | 25% | 31,850 | 29,970 | https://www.tronic.co.ke/collections/insect-killer |
| tronic-ik-gc20-20w-insect-killer | exact catalogue pack/model | 8,070.75 [RETAIL-ESTIMATE] (lowest 9,495) | 30% | 10,500 | 9,495 | https://www.tronic.co.ke/collections/insect-killer |
| tronic-ik-gc30-30w-insect-killer | exact catalogue pack/model | 7,650 [RETAIL-ESTIMATE] (lowest 9,000) | 30% | 9,950 | 9,000 | https://www.tronic.co.ke/collections/insect-killer |
| tronic-ik-gc40-40w-insect-killer | exact catalogue pack/model | 10,480.5 [RETAIL-ESTIMATE] (lowest 12,330) | 30% | 13,650 | 12,330 | https://www.tronic.co.ke/collections/insect-killer |
| uv-stabilised-hdpe-insect-net-3m-x-50m | exact catalogue pack/model | 12,750 [RETAIL-ESTIMATE] (lowest 15,000) | 30% | 16,600 | 15,000 | https://www.symnet.co.ke/solutions/insect-nets; https://shop.irrihub.com/products/pro-insect-net |
| tvs-hlx-100cc-chain-and-sprocket-kit-n8320100 | exact catalogue pack/model | 2,124.15 [RETAIL-ESTIMATE] (lowest 2,499) | 30% | 2,750 | 2,499 | https://fdrautogarage.co.ke/product/tvs-hlx-100cc-chain-sprocket-kit-drive-set-n8320100/ |
| tvs-hlx-150-4gear-chain-sprocket-kit-szn6320660-fresh | exact catalogue pack/model | 2,612.9 [RETAIL-ESTIMATE] (lowest 3,074) | 30% | 3,400 | 3,074 | https://cargen.com/product/chain-sprocket-kit-2/ |
| tvs-hlx-150-clutch-assembly-primary-gear-2060t132-fresh-20261108 | exact catalogue pack/model | 2,082.5 [RETAIL-ESTIMATE] (lowest 2,450) | 30% | 2,700 | 2,450 | https://fdrautogarage.co.ke/product-category/auto-parts/ |
| tvs-hlx-150-clutch-boss-hub-disc-2061t131-fresh-20261108 | exact catalogue pack/model | 850 [RETAIL-ESTIMATE] (lowest 1,000) | 30% | 1,100 | 1,000 | https://fdrautogarage.co.ke/product-category/auto-parts/ |
| tvs-hlx-125-150-clutch-bearing-6201-420602000-fresh-20261108 | exact catalogue pack/model | 340 [RETAIL-ESTIMATE] (lowest 400) | 30% | 450 | 400 | https://fdrautogarage.co.ke/product-category/auto-parts/ |

All baselines are [RETAIL-ESTIMATE] (lowest matched in-stock Kenyan retail × 0.85), not wholesale quotes. Formula prices rounded to nearest KSh50. Trinity Gold 5kg current KSh13,299 is >25% above the three observed market prices (Agropests KSh8,590, Imagine Care KSh9,499 and Farm Rescue KSh10,635); formula baseline KSh7,301.50 × 1.30 = KSh9,492, rounded KSh9,500. Tronic 10W, 15W, IK7039-20, GA80, GC20, GC30 and GC40 prices use the manufacturer shop's exact model price list and 85% retail-estimate baseline; 80W GA80 uses the 25% tier because baseline exceeds KSh20,000. The 36W and 7071-10 models were not reduced because their current prices are not >25% above the observed comparison average. UV insect net 3m × 50m roll is supported by Symnet and IrriHub exact-size listings at KSh15,000; current KSh19,500 was >25% above the market average, so it is reduced to formula-derived KSh16,600. TVS items with exact part/model references were priced from FDR Auto Garage or Car & General references; where the current price was below formula-derived retail, prices are increased to the calculated amount.

## Needs Manual Price Check / unchanged

- Trinity Gold 50g/100g/250g/500g/1kg: current prices compared with Farm Rescue and Imagine Care; current values are not >25% above the market average or are below the formula, so no reductions.
- Trustmate 250EC 5L: Agroduka KSh18,000 in stock vs current KSh22,500. Only one exact in-stock source; not >25% above market by a multiple-retailer average, so unchanged.
- Tronic IK7011-36 and IK7071-10: current prices exceed one or two references, but do not breach the >25% reduction threshold; unchanged. IKGP02 not priced in the returned official price list.
- TVS HLX parts without exact part-number/model matches (cables, carburettor parts, seals, piston rings, cylinder blocks, bearings, etc.) remain unchanged; do not infer interchangeability across HLX100/125/150 or Ocelot versions.
- VectorFog BY100/BY200/C100/C150+/C20/DC20/H100SF/H200SF foggers: no reliable current Kenyan exact-model in-stock prices returned; unchanged.
- Undertaker 480EC 1L and 50ml: AgriGuard prices KSh2,200 and KSh200 respectively, but no second exact in-stock comparable seller in this search set; unchanged.
- Other unchanged products include Trevin Dudu Dust, Triger 5EC, Trinity Gold sizes not repriced, Tronic models not listed above, Tsavo seeds, Turbo sprayer, TVS items without exact references, Twigalaxyl, Twigamectin, TYMX speaker, Ullman mirror, smart watch, ultrasonic repeller, universal fly glue boards, UV tubes and lamps, UV-treated bird net, Uvuko sprayer, V-Multinor, Vanguard, Vaultex respirator, and remaining catalogue rows in this segment.

No new pack variants were created. Existing product URLs/slugs are preserved. SQL: `supabase/sql/pricing-batch-015.sql` (guarded review-branch changes only; not applied to production). Product JSON-LD and sitemap refresh require applying catalogue SQL and running the product build. The generator uses the catalogue price for KES Product Offer schema, sets availability and one-year `priceValidUntil`, and updates sitemap `lastmod` when generated product HTML changes.


---

### Additional Batch 14 pricing research — 8 further products

Syngenta exclusions left untouched: Tatua Rat and Mice Poison Blocks; Tatua Advion 30g; Tatua Advion 4×30g; Tatua Demand 10CS 25ml; Tatua Klerat 100g; Tatua Zyrox 500g; Tervigo 020SC 5L; and Thiovit Jet Sulphur 1kg.

#### Additional prepared price updates

| Product | Pack | Baseline Cost (KES) | Markup | New Price (KES) | Competitor Retail (KES) | Source Reference |
|---|---|---:|---:|---:|---:|---|
| tecno-camon-50-pro-8gb-256gb-20261108 | Existing pack | 35,700 [RETAIL-ESTIMATE] | 25% | 44,650 | 42,000 (avg 42,866) | https://www.phonetronicskenya.co.ke/brands/tecno-mobile; https://www.jumia.co.ke/tecno-official-store/; https://orifon.co.ke/brand/tecno/ (ex VAT) |
| tecno-camon-50-8gb-256gb-20261108 | Existing pack | 28,050 [RETAIL-ESTIMATE] | 25% | 35,050 | 33,000 (avg 33,666) | https://www.phonetronicskenya.co.ke/brands/tecno-mobile; https://www.jumia.co.ke/tecno-official-store/; https://orifon.co.ke/brand/tecno/ (ex VAT) |
| tecno-pop-20-4gb-64gb-20261108 | Existing pack | 12,579.15 [RETAIL-ESTIMATE] | 30% | 16,350 | 14,799 (avg 14,900) | https://www.kilimall.co.ke/store/TECNO-Official-Store; https://www.phonetronicskenya.co.ke/brands/tecno-mobile; https://orifon.co.ke/brand/tecno/ (ex VAT) |
| tecno-spark-50-4g-4gb-128gb-20261108 | Existing pack | 15,809.15 [RETAIL-ESTIMATE] | 30% | 20,550 | 18,599 (avg 19,049) | https://www.kilimall.co.ke/store/TECNO-Official-Store; https://www.phonetronicskenya.co.ke/brands/tecno-mobile; https://orifon.co.ke/brand/tecno/ (ex VAT) |
| tecno-spark-50-4g-8gb-256gb-20261108 | Existing pack | 19,550 [RETAIL-ESTIMATE] | 30% | 25,400 | 23,000 (avg 23,499) | https://www.phonetronicskenya.co.ke/brands/tecno-mobile; https://www.kilimall.co.ke/store/TECNO-Official-Store |
| tecno-spark-50-pro-8gb-256gb-20261108 | Existing pack | 21,674.15 [RETAIL-ESTIMATE] | 25% | 27,100 | 25,499 (avg 25,499) | https://www.kilimall.co.ke/store/TECNO-Official-Store; https://www.phonetronicskenya.co.ke/brands/tecno-mobile |
| tehno-mss-g010-10-litre-poultry-drinker | Existing pack | 637.5 [RETAIL-ESTIMATE] | 30% | 850 | 750 (avg 750) | https://www.myagrovet.co.ke/products.php?id=5709 |
| total-twp215002-2hp-1500w-centrifugal-water-pump | Existing pack | 18,954.15 [RETAIL-ESTIMATE] | 30% | 24,650 | 22,299 (avg 22,649) | https://www.digitalstore.co.ke/products/total-twp215002-2hp-1500w-centrifugal-water-pump; https://shopit.co.ke/total-twp215002-2hp-centrifugal-water-pump |

The six Tecno handset updates use exact storage/RAM models from the TECNO Official Store on Kilimall and Phonetronics Kenya. Orifon Nairobi prices are shown ex-VAT and were not used as the lowest baseline where an inc-VAT price was available. The Total TWP215002 pump update is based on two Kenyan retail listings for the same 2HP model. Tehno Mss G010 10L drinker is priced from MyAgrovet's exact model G010 at KSh750.

## Needs Manual Price Check

Other poultry drinkers/feeders remain unchanged where the calculated price would require a reduction that fails the 25%-above-average rule, or where only one exact supplier price was found and the existing price is already above the formula result. This includes Tehno Mss 1.5kg feeder duplicates, 6L/8L/9L drinkers, 9kg feeder, W6 6kg feeder/set of 10, rabbit drinkers, A42 nipple set, cow anti-kick bar, automatic bell drinker, and other models without a comparable second retailer. Remaining products include sprayers, pumps, PPE, seeds, household products and chemicals without exact current price/stock evidence. Tecno Spark Go 3 4GB/64GB remains manual because a reliable current exact-model Kenya price was not found. TCL 75C6K is retained because its current price is within the observed market range.

SQL: `supabase/sql/pricing-batch-014.sql` (guarded, review branch only; not production). Existing slugs/URLs preserved.


### Additional exact-model price update

| Product | Pack / model | Baseline (KES) | Markup Tier | New Website Price (KES) | Competitor Retail (KES) | Source |
|---|---|---:|---:|---:|---:|---|
| Turbo TR20 20L 2-in-1 manual and battery knapsack sprayer | TR20-2 | 9,775 [RETAIL-ESTIMATE] | 30% | 12,700 | 11,500 | https://logike.co.ke/product_details/Turbo-20-Liters-2-in-1-Battery-and-Manual-Sprayer/73932373 |

Logike lists the exact TR20-2 model in stock at KSh11,500. Baseline is KSh9,775 (retail × 0.85), and 30% markup rounds to KSh12,700.


---

# Batch 16 — products 1501–1600 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 100 |
| Syngenta products skipped | 1 |
| Existing product prices updated | 15 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 84 |

**Syngenta exclusion (untouched):** Voliam Targo 063SC Insecticide 100ml. Syngenta brand/vendor confirmation is explicit in the AgriJibu and Agroduka listings.

## Prepared price updates

| Product | Pack/model | Baseline (KES) | Markup | New Website Price (KES) | Competitor Retail / Average (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| vision-plus-vpwm12tt-12kg-twin-tub-washing-machine | exact model/pack | 26,345.75 [RETAIL-ESTIMATE] (retail 30,995) | 25% | 32,950 | 33,495 | https://visionplus.co.ke/; https://taelappliances.co.ke/brand/vision-plus/ |
| vivo-v50-lite-4g-8gb-256gb-20261108 | exact model/pack | 29,325 [RETAIL-ESTIMATE] (retail 34,500) | 25% | 36,650 | 34,500 | https://infinitetech.co.ke/product/vivo-v50-lite-4g/; https://phonepointkenya.co.ke/product/vivo-v50lite-4g-8gb-256gb/ |
| vitron-htc4300qfs-qled-android-smart-tv-with-wall-mount-43-inch | exact model/pack | 16,659.15 [RETAIL-ESTIMATE] (retail 19,599) | 30% | 21,650 | 20,700 | https://www.jumia.co.ke/htc4300qfs-43inch-qled-tv-bluetooth-enabled-full-hd-frameless-smart1yr-wrty-vitron-mpg9595722.html; https://www.jumia.co.ke/vitron-htc4300qfs-43-inch-tv-qled-full-hd-tv-frameless-digital-smart-android-tv-inbuilt-decoderbluetooth-enabled-tv-icast-screen-mirroringwifi-enabled-netflixyoutubeappstore-vitron43-tv-black-tv-guard-bracket-48093030.html; https://www.jumia.co.ke/vitron-htc4300qfs-43-inch-qled-tv-full-hd-tv-frameless-digital-smart-android-tv-bluetooth-enabled-wifi-enabled-netflix-youtube-icast-frameless-screen-vitron43-black-14-months-warranty-4-extra-gifts-328298174.html |
| von-vadz0002k-portable-water-dispenser | exact model/pack | 722.5 [RETAIL-ESTIMATE] (retail 850) | 30% | 950 | 850 | https://von.co.ke/product/von-vadz0002k-portable-water-dispenser; https://hotpoint.co.ke/catalogue/von-vadz0002k-portable-water-dispenser/ |
| von-vaf050dstk-5l-slim-digital-air-fryer | exact model/pack | 7,645.75 [RETAIL-ESTIMATE] (retail 8,995) | 30% | 9,950 | 8,995 | https://von.co.ke/shop/kitchen-essentials/cooking-baking-and-more; https://hotpoint.co.ke/catalogue/von-vaf050dstk-slim-digital-air-fryer-5l_/ |
| von-vct-220dbcx-2-burner-gas-cooker | exact model/pack | 3,820.75 [RETAIL-ESTIMATE] (retail 4,495) | 30% | 4,950 | 4,595 | https://hotpoint.co.ke/catalogue/von-vct-220dbcx-cooker-2gas-direct-fire-dual-burners/; https://von.co.ke/ |
| von-vft-42246-dmk-42-inch-tower-fan | exact model/pack | 11,045.75 [RETAIL-ESTIMATE] (retail 12,995) | 30% | 14,350 | 12,995 | https://www.hotpoint.co.ke/catalogue/von-vft-42246-dmk-42-tower-fan-black/ |
| von-vkdg156smk-1-5l-digital-kettle | exact model/pack | 3,820.75 [RETAIL-ESTIMATE] (retail 4,495) | 30% | 4,950 | 4,495 | https://www.hotpoint.co.ke/catalogue/von-vkdg156smk-digital-kettle-1-5l-1800w-black/; https://von.co.ke/shop/kitchen-essentials/cooking-baking-and-more |
| von-vms-206mmk-20l-solo-microwave | exact model/pack | 6,370.75 [RETAIL-ESTIMATE] (retail 7,495) | 30% | 8,300 | 7,745 | https://www.hotpoint.co.ke/catalogue/von-vms-206mmk-solo-microwave-oven-20l-black/; https://von.co.ke/shop/kitchen-essentials/microwave |
| von-vrc5716nmx-5l-rice-cooker | exact model/pack | 3,395.75 [RETAIL-ESTIMATE] (retail 3,995) | 30% | 4,400 | 3,995 | https://www.hotpoint.co.ke/catalogue/von-vrc5716nmx-rice-cooker-5l-650w-stainless-steel/; https://von.co.ke/shop/kitchen-essentials/cooking-baking-and-more |
| von-vsm211ax-2-slice-sandwich-maker | exact model/pack | 1,950.75 [RETAIL-ESTIMATE] (retail 2,295) | 30% | 2,550 | 2,345 | https://www.hotpoint.co.ke/catalogue/category/kitchen-small-home-appliances/kitchen-essentials/sandwich-makers/; https://gea.ke/product/von-vsm211ax-2-slice-sandwich-maker/ |

All baselines are [RETAIL-ESTIMATE] (lowest reliable Kenyan retail × 0.85), not wholesale quotes. Price reductions: VON portable water dispenser VADZ0002K (current KSh1,150 vs official VON and Hotpoint KSh850; formula KSh950), VON VKDG156SMK kettle (current KSh5,850 vs VON/Hotpoint KSh4,495; formula KSh4,950), and VON VRC5716NMX rice cooker (current KSh5,199 vs VON/Hotpoint KSh3,995; formula KSh4,400). Each existing price was >25% above the same-model market observations, so reduction guard is satisfied. Price increases: Vision Plus 12kg twin tub washer, vivo V50 Lite 8/256GB, Vitron HTC4300QFS 43-inch QLED TV, VON VAF050DSTK 5L air fryer, VON VCT-220DBCX cooker, VON VFT-42246-DMK tower fan, VON VMS-206MMK microwave and VON VSM211AX sandwich maker. These follow the tier formula; prices are rounded to KSh50. The new prices are within approximately 10% of their observed market averages except the 42-inch tower fan, where only one exact supplier listing was found and the formula price is approximately 10.4% above it.

## Checked / unchanged and manual checks

- VON VAF080DSTK 8L air fryer: multiple listings include KSh9,300, KSh9,499, KSh9,995 and KSh10,389; current KSh10,999 is not >25% above the market average, so no reduction.
- VON VPC613XMK 6L pressure cooker: Hotpoint KSh7,995, TechHub KSh9,900 and Tabarak KSh9,995; current KSh9,999 is close to market average and not >25% above it, so unchanged.
- VON VMS-206DGK 20L digital microwave: current KSh8,499 compared with Hotpoint KSh9,995, VON KSh7,995 and Crosstech KSh7,499; no reduction justified by the multiple-source average.
- VON VBP351NLW 350W blender: Hotpoint KSh3,495 and Naivas KSh4,725; current KSh4,550 is not >25% above market average; unchanged.
- VON VBP501NLB 500W blender: Naivas KSh3,995; one comparable source, unchanged.
- Vision Plus 220L fridge: Vision Plus official KSh39,995, TAEL KSh39,000 and Digital Store KSh34,790; current KSh41,399 is not >25% above the market average; unchanged.
- WQ 1/2-inch 30m chicken wire: MyAgrovet exact WQ model KSh1,950; only one exact independent seller listing, so retained pending a second matching price. Width/model differences in generic mesh are not treated as exact matches.
- WQ 3kg/6kg feeders, WQ drinkers, egg incubators and other poultry gear were compared with MyAgrovet, Mkulima Jovial, Fuga and EcoKuku. Similar-capacity generic feeders/drinkers are not assumed to be identical WQ models; no speculative reductions.
- Wokin 573205 5L sprayer: exact-model listings range KSh2,050–2,850 (Kreatives, Benatech and VOH); current KSh2,399 is close to the observed average, unchanged. Wokin 573320 20L sprayer MyAgrovet KSh5,900 is the only exact model quote found; no reduction.
- WQ 528 incubator: prices for 528-egg machines range KSh59,000–65,000, but build, turning, inverter and warranty configurations differ. Current price is close to market average; unchanged.
- VectorFog H300SF/H400SF/H500SF/TU100N, VectorGel DH1, Vision Plus TV/fridge/microwave models without exact spec matches, Vitabor Gold, Vitra 40WG, Vondozeb, Weed-Out 480SL, Velcro mosquito net, WQ animal troughs, WQ water quality meters, WQ sprayers and remaining items stay unchanged pending exact current Kenyan supplier prices and stock verification.

No new pack variants were added. Existing slugs/canonical URLs are preserved. SQL: `supabase/sql/pricing-batch-016.sql` (guarded review-branch updates only; not applied to production). Product JSON-LD and sitemap refresh require applying the catalogue SQL and running the product build; generator uses catalogue price for KES Offer schema, includes availability and one-year `priceValidUntil`, and updates sitemap `lastmod` on changed generated pages.


---

# Batch 17 — final products 1601–1647 — 2026-11-17

| Measure | Count |
|---|---:|
| Products scanned | 47 |
| Syngenta products skipped | 0 |
| Existing product prices updated | 9 |
| New pack variants | 0 |
| Needs manual price check / unchanged | 38 |

No Syngenta products were identified in this final segment. All listed Yara, Xiaomi, WQ, YAGO and Zagro products are non-Syngenta.

## Prepared price updates

| Product | Pack/model | Baseline (KES) | Markup Tier | New Website Price (KES) | Competitor Retail (KES) | Source |
|---|---|---:|---:|---:|---:|---|
| yaravita-crop-boost-foliar-fertilizer-1l | exact listed model/pack | 1,232.5 [RETAIL-ESTIMATE] (retail 1,450) | 30% | 1,600 | 1,450 | https://agropests.com/products/yaravita%20crop%20boost%201l |
| yaravita-powerboost-foliar-fertilizer-1l | exact listed model/pack | 1,266.5 [RETAIL-ESTIMATE] (retail 1,490) | 30% | 1,650 | 1,490 | https://agropests.com/products/yaravita-power-boost-1l |
| xiaomi-air-fryer-essential-6l | exact listed model/pack | 7,649.15 [RETAIL-ESTIMATE] (retail 8,999) | 30% | 9,950 | 8,999 | https://xiaomistorekenya.co.ke/product-category/appliances/fryer/; https://xiaomi-store.co.ke/product-category/kitchenappliances/air-fryers/ |
| xiaomi-dual-zone-air-fryer-10l | exact listed model/pack | 15,299.15 [RETAIL-ESTIMATE] (retail 17,999) | 30% | 19,900 | 17,999 | https://xiaomistorekenya.co.ke/product-category/appliances/fryer/; https://xiaomi-store.co.ke/product-category/kitchenappliances/air-fryers/ |
| xiaomi-smart-air-fryer-4-5l | exact listed model/pack | 10,624.15 [RETAIL-ESTIMATE] (retail 12,499) | 30% | 13,800 | 12,499 | https://xiaomistorekenya.co.ke/product-category/appliances/fryer/; https://xiaomistores.co.ke/category/smart-home/kitchen-appliances/ |
| xiaomi-poco-c71-3gb-ram-plus-64gb-3gb-plus-64gb | exact listed model/pack | 11,474.15 [RETAIL-ESTIMATE] (retail 13,499) | 30% | 14,900 | 13,499 | https://xiaomistores.co.ke/product/poco-c71-3gb-64gb/; https://www.xiaomihomekenya.co.ke/products/poco-c71-3gb-64gb |
| xiaomi-redmi-15c-8gb-ram-plus-256gb-8gb-plus-256gb | exact listed model/pack | 18,699.15 [RETAIL-ESTIMATE] (retail 21,999) | 30% | 24,300 | 21,999 | https://xiaomistorekenya.co.ke/product/redmi-15c-8gb-ram-256gb-storage/; https://xiaomistorekenya.co.ke/product-tag/redmi-15c/ |
| xiaomi-electric-glass-kettle-1-7l | exact listed model/pack | 3,450 [RETAIL-ESTIMATE] (retail 4,059) | 30% | 4,500 | 4,059 | https://xiaomistores.co.ke/category/smart-home/kitchen-appliances/ |
| xiaomi-electric-kettle-2-lite-1-5l | exact listed model/pack | 3,943.01 [RETAIL-ESTIMATE] (retail 4,638.84) | 30% | 5,150 | 4,638.84 | https://xiaomistores.co.ke/category/smart-home/kitchen-appliances/ |

All baselines are [RETAIL-ESTIMATE] (lowest current Kenyan retail × 0.85), not wholesale quotations. Prices are rounded to nearest KSh50. YaraVita Crop Boost and PowerBoost 1L use Agropests in-stock prices KSh1,450 and KSh1,490 respectively. Xiaomi air fryers and phones use Xiaomi Kenya in-stock listings. Xiaomi glass kettle and Kettle 2 Lite prices shown by Xiaomi Store Kenya are VAT-exclusive; VAT was added before applying the 15% retail estimate and markup, giving retail comparators KSh4,059 and KSh4,638.84. No existing prices were reduced in this batch; all nine formula prices are above the current catalogue price.

## Checked / unchanged and manual checks

- YaraTera Calcinit 25kg: Kihysoco KSh3,500 in stock; Dawn Farmers KSh3,400 is marked sold out. Current KSh4,500 is not reduced based on one current source; no multi-retailer average to trigger the >25% reduction rule.
- Xiaomi Redmi Note 15 Pro 4G 8GB/256GB: Xiaomi Store Kenya KSh36,999 in stock; market comparison indicates the current KSh36,999 is aligned. No change.
- Xiaomi TV Stick 4K 2nd Gen: Xiaomi Store Kenya KSh7,799 VAT-exclusive (tax-inclusive KSh9,046.84) and Xiaomi Store reseller KSh7,199; current KSh8,299 is not >25% above the observed market and no reduction is justified.
- Xiaomi Poco C71 official-store alternative from Xiaomi Home is sold out; in-stock Xiaomi Store Kenya price KSh13,499 used for the formula increase.
- Xiaomi Redmi 15C 8GB/256GB: Xiaomi Store Kenya KSh21,999 in stock; current KSh20,899 was below the formula-derived KSh24,300.
- Xiaomi Smart LED Bulb: two Kenyan Xiaomi retailers show KSh1,999; current KSh2,299 is only 15% above market, below the >25% reduction threshold.
- Xiaomi Smart Air Purifier 4 Lite: lowest XiaomiHome KSh24,499 listing is sold out; no current in-stock exact price verified, so unchanged.
- Xiaomi Body Composition Scale S400: observed prices KSh3,699–3,999; current KSh4,599 is not >25% above the multi-retailer average, so unchanged.
- Yara DAP Chapa Meli 50kg, YaraSuna Organic 50kg, YaraTera Calcinit, Vitabor Gold, Vondozeb, Zagro Ultraxide, Zetanil, Zinbor, Zinc Gold, Zinc Sulphate and Zincabor remain unchanged where exact current in-stock pack pricing or multiple comparable supplier data was not confirmed.
- WQ solar 56/104/128-egg incubators, wheelbarrow, watering cans, livestock balling gun and silicone teats remain unchanged because comparable listings differ by capacity, construction or specification. No missing pack variants were confirmed with exact supplier prices.
- Xiaomi TV sticks, kettles, pressure cooker, rice cooker, reading light, portable blender and air purifier remain unchanged where the observed retailer price is tax-exclusive, stock is unclear, or no comparable in-stock listing supports a safe adjustment.

No new pack variants were added. Existing slugs/canonical URLs are preserved. SQL: `supabase/sql/pricing-batch-017.sql` (guarded review-branch update only; not applied to production). The product generator is set up to emit KES Product Offer price, availability and one-year `priceValidUntil`; run product build after applying the catalogue SQL to refresh generated JSON-LD and sitemap `lastmod` values.


### Additional Batch 16 exact-model price updates

| Product | Pack/model | Baseline (KES) | Markup | New Price (KES) | Competitor retail (KES) | Sources |
|---|---|---:|---:|---:|---:|---|
| VON VGS161HSK 1600W Garment Steamer | VGS161HSK | 2,965.65 [RETAIL-ESTIMATE] | 30% | 3,850 | 3,489–3,995 (average ~3,868) | https://www.digitalstore.co.ke/products/von-vgs161hsk-1600w-handheld-garment-steamer-fast-efficient-fabric-steaming-for-home-use; https://www.hotpoint.co.ke/catalogue/von-vgs161hsk-handheld-garment-steamer-non-foldable-steam-head-1600w/; https://www.carrefour.ke/mafken/en/garment-steamers/von-gmnt-steamr-vgs161hsk-1600w-blk/p/238462; https://tabarakelectronics.co.ke/product/von-hand-held-garment-steamer-1600w-black-vgs161hsk/ |
| VON VMS-206DGK 20L Digital Microwave | VMS-206DGK | 6,795.75 [RETAIL-ESTIMATE] | 30% | 8,850 | 7,995–8,995 | https://von.co.ke/shop/kitchen-essentials/microwave; https://www.hotpoint.co.ke/catalogue/von-vms-206dgk-digital-solo-microwave-oven-20l-sand-black/; https://crosstech.ke/products/von-20l-digital-microwave-vms-206dgk |
| VON VPC613XMK 6L Pressure Cooker | VPC613XMK | 8,495.75 [RETAIL-ESTIMATE] | 30% | 11,050 | 9,995 | https://von.co.ke/shop/kitchen-essentials/cooking-baking-and-more; https://www.hotpoint.co.ke/catalogue/category/cooking/ |
| WQ 528-Egg Automatic Incubator | 528 eggs | 55,250 [RETAIL-ESTIMATE] | 20% | 66,300 | 65,000 | https://mkulimajovial.co.ke/product-category/poultry/incubators/ |

The VON steamer price is reduced because the current KSh5,199 is more than 25% above multiple exact-model Kenya listings (Digital Store, Hotpoint, Carrefour and Tabarak). VMS-206DGK, VPC613XMK and WQ 528 incubator are increased to the calculated tier price using current exact-model Kenyan retail observations.


---

# Batch 18 — inactive catalogue records — 2026-11-17

| Measure | Count |
|---|---:|
| Inactive products scanned | 85 |
| Syngenta excluded | 1 |
| Inactive non-Syngenta records retained unchanged | 84 |
| Price updates | 0 |
| New pack variants | 0 |

**Syngenta exclusion:** Apron Star 42WS Seed Dressing 10g — left untouched. The other 84 products are already inactive and therefore are not purchasable storefront listings; they were not repriced or reactivated. Their existing IDs, slugs and prices are preserved. No market-price update is applied to discontinued, archived or otherwise inactive listings without an explicit reactivation decision.

SQL record: supabase/sql/pricing-batch-018.sql (no-op audit record; no product data changed).

---

# Final catalogue coverage summary

| Measure | Total |
|---|---:|
| Active catalogue records scanned | 1,647 |
| Inactive catalogue records scanned | 85 |
| **Total catalogue records scanned** | **1,732** |
| Syngenta products excluded (active + inactive) | 62 |
| Active non-Syngenta products eligible for pricing review | 1,586 |
| Existing product price updates prepared in guarded SQL | 205 |
| New pack variants prepared in guarded SQL | 25 |
| Active non-Syngenta products needing manual price verification / unchanged | 1,377 |
| Active non-Syngenta products verified already at correct formula price | 4 |
| Inactive non-Syngenta products retained unchanged | 84 |

The 205 prepared price updates cover 205 unique active product IDs after removing the duplicate Samsung 43U8000F row from Batch 14; that TV update is assigned to Batch 13. The 28 new pack variants have unique IDs checked against the catalogue. All updates are protected by expected-current-price guards; new variants use idempotent inserts. These are staged branch changes, not production writes.

**Branch status:** all 18 batch SQL files and this handoff are committed to `pricing/non-syngenta-market-review-20261117`, based on `main`. No merge to `main` has been performed. Existing product URLs/slugs are preserved. No production database prices or storefront pages have been changed.

**SEO/schema status:** the branch's product generator is confirmed to emit `priceCurrency: KES`, a numeric Product Offer `price`, stock-based `https://schema.org/InStock` / `OutOfStock` availability, and a `priceValidUntil` one year from generation. Product sitemap `<lastmod>` values are refreshed when generated product HTML changes. However, catalogue SQL remains staged only. The generated live product JSON-LD and sitemap timestamps are therefore **not yet synced to these proposed prices**. After review/merge and execution of the SQL, run the product-page build and deployment, then verify representative Product JSON-LD prices and sitemap `lastmod` values before declaring the live site synced.

**Deployment safety:** guarded SQL requires each existing product to still match its captured expected price and active status. Each new variant insert uses a stable ID and `ON CONFLICT (id) DO NOTHING`. Review new pack descriptions and add exact pack photos before public release. Supplier baselines labelled [RETAIL-ESTIMATE] are the lowest matched Kenyan retail price × 0.85; they are not wholesale quotations.


## Final reconciliation and profit-floor check

The SQL files contain **204 actual price changes** across 204 unique existing product records; one no-op Accent 600SC line was removed from the SQL and moved to the verified-no-change list. The 1056-egg incubator price was raised from KSh76,400 to KSh76,500: at a KSh65,000 baseline, KSh76,400 produces a 14.92% gross margin, just below the strict 15% floor. KSh76,500 clears the 15% floor after KSh50 rounding. The 110m solar pump at KSh98,000 has a 15.00% gross margin on its KSh83,300 baseline.

Weighted by the staged markup tiers, the estimated average gross margin across the 204 existing-product price changes is approximately **22.7%** before payment fees, delivery, tax treatment and operating expenses. This is a gross margin calculation, not net profit. The 17.5% markup tier mathematically gives about 14.9% gross margin before rounding, so the strict 15% floor is enforced by rounding up where needed.

| Batch SQL | Actual existing-product price changes | New pack variants |
|---|---:|---:|
| 001 | 22 | 0 |
| 002 | 14 | 0 |
| 003 | 11 | 0 |
| 004 | 41 | 0 |
| 005 | 12 | 0 |
| 006 | 3 | 3 |
| 007 | 7 | 0 |
| 008 | 8 | 7 |
| 009 | 7 | 0 |
| 010 | 6 | 2 |
| 011 | 6 | 6 |
| 012 | 10 | 4 |
| 013 | 7 | 3 |
| 014 | 12 | 0 |
| 015 | 15 | 0 |
| 016 | 15 | 0 |
| 017 | 9 | 0 |
| **Total** | **205** | **25** |


**Estimated average gross profit margin:** approximately 22.7% across the 205 staged existing-product price changes, weighted by the applied markup tiers and rounded prices. This is gross margin against the supplier/estimated baseline, before operating costs, payment fees, delivery, taxes and returns. The strict 15% margin floor was also checked for the 17.5%-markup tier: the 1056-egg incubator is rounded up to KSh76,500 to clear 15%; the 110m solar pump at KSh98,000 yields 15.0%.
