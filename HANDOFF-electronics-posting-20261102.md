# Electronics posting handoff — 2026-11-02

## Done
Twelve new products inserted directly into Supabase project `oewvtbnmyombbtggamor` (table `products`). All `active=true`, `featured=true`, stock 1,000, low_at 20, `images` empty.
Prices are the lowest market-reference prices found online (Kenyan retailers / Jumia) on 2026-11-02. Cost is an ESTIMATE at 85% of price (`round(price*0.85,2)`), same convention as the 2026-11-02 pest-control batch. It is not a supplier invoice cost.

| id | Category | Price (KES) | Cost est. (KES) |
|---|---|---:|---:|
| canon-pixma-g3430-all-in-one-wifi-ink-tank-printer | 19 Printers & Office Machines | 27,074 | 23,012.90 |
| e-pos-80mm-thermal-receipt-printer | 19 | 15,500 | 13,175.00 |
| hp-laserjet-mfp-m141w-wireless-mono-laser-printer | 19 | 19,980 | 16,983.00 |
| canon-pixma-g2410-all-in-one-refillable-ink-tank-printer | 19 | 21,000 | 17,850.00 |
| epson-ecotank-l3250-wifi-all-in-one-ink-tank-printer | 19 | 25,704 | 21,848.40 |
| asus-150w-laptop-charger-adapter-19-5v-7-7a | 7 Computing | 4,800 | 4,080.00 |
| asus-zenbook-14-oled-laptop | 7 | 165,000 | 140,250.00 |
| asus-rog-zephyrus-g16-gaming-laptop-platinum-white | 7 | 300,000 | 255,000.00 |
| apple-macbook-pro-14-m3-pro-space-black | 7 | 220,000 | 187,000.00 |
| apple-iphone-16-128gb-white | 2 Phones & Tablets | 98,000 | 83,300.00 |
| apple-iphone-16-128gb-green | 2 | 99,500 | 84,575.00 |
| apple-iphone-17-pro-max-256gb-orange | 2 | 179,260 | 152,371.00 |

## Assumptions to confirm with owner
- MacBook Pro chip assumed M3 Pro (price 220,000 is the M3 Pro low end; M3 Max starts about 350,000).
- Zenbook 14 OLED and ROG Zephyrus G16: exact CPU/GPU/RAM/SSD unknown; descriptions say "confirm specification before ordering". Zenbook price is the lowest 14 OLED price found (Ryzen AI 7 model); Core Ultra 9 models are 200,000+. ROG price is the lowest found (2024 GU605MV, refurbished listing 299,999).
- iPhone 16 priced at the 128GB low end. The green photo may be a different colour name (Apple lists teal); check.
- HP M141w price 19,980 was the lowest of several listings (21,850 to 25,000).

## Blocked / remaining
1. PHOTOS: not attached. The 12 customer photos are in the chat uploads only; the GitHub tool cannot push binary files. Upload to the public `product-images` bucket (or `product-photos/` in the repo) and set `products.images` for each id. Until then the items show without photos.
2. Confirm the scheduled `product-pages.yml` run succeeds, then check the 12 `/p/<id>.html` pages and sitemap entries on https://stermontarcade.co.ke.
3. Replace estimated costs with real supplier costs.
4. Do not use the old temporary `upload-photos` helper.

Branch: `wip-electronics-posting-20261102` (note-only; no generated files touched). Merge note to `main` once the photos and live pages are verified.
