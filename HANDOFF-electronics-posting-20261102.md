# Electronics posting handoff — 2026-11-02

## Done
Twelve new products inserted into Supabase project `oewvtbnmyombbtggamor` (table `products`). All `active=true`, `featured=true`, stock 1,000, low_at 20, `images` empty.

Pricing (updated after owner request): cost = lowest market-reference price found online on 2026-11-02 (Kenyan retailers / Jumia); selling price = cost + 15% (`round(cost*1.15)`). Costs are market reference prices, not supplier invoices.

| id | Category | Cost (KES) | Selling price (KES) |
|---|---|---:|---:|
| canon-pixma-g3430-all-in-one-wifi-ink-tank-printer | 19 Printers & Office Machines | 27,074 | 31,135 |
| e-pos-80mm-thermal-receipt-printer | 19 | 15,500 | 17,825 |
| hp-laserjet-mfp-m141w-wireless-mono-laser-printer | 19 | 19,980 | 22,977 |
| canon-pixma-g2410-all-in-one-refillable-ink-tank-printer | 19 | 21,000 | 24,150 |
| epson-ecotank-l3250-wifi-all-in-one-ink-tank-printer | 19 | 25,704 | 29,560 |
| asus-150w-laptop-charger-adapter-19-5v-7-7a | 7 Computing | 4,800 | 5,520 |
| asus-zenbook-14-oled-laptop | 7 | 165,000 | 189,750 |
| asus-rog-zephyrus-g16-gaming-laptop-platinum-white | 7 | 300,000 | 345,000 |
| apple-macbook-pro-14-m3-pro-space-black | 7 | 220,000 | 253,000 |
| apple-iphone-16-128gb-white | 2 Phones & Tablets | 98,000 | 112,700 |
| apple-iphone-16-128gb-green | 2 | 99,500 | 114,425 |
| apple-iphone-17-pro-max-256gb-orange | 2 | 179,260 | 206,149 |

## Assumptions to confirm with owner
- MacBook Pro chip assumed M3 Pro (M3 Max starts about 350,000).
- Zenbook 14 OLED and ROG Zephyrus G16: exact CPU/GPU/RAM/SSD unknown; descriptions say "confirm specification before ordering".
- iPhone 16 priced at 128GB; green photo may be a different colour name (Apple lists teal).

## Blocked / remaining
1. PHOTOS: not attached (GitHub tool cannot push binary files). Upload the 12 photos to the public `product-images` bucket or `product-photos/` and set `products.images` per id.
2. SEO: owner is handling titles/SEO herself/himself; descriptions and seo_title are first drafts.
3. Confirm the scheduled `product-pages.yml` run succeeds, then check the 12 `/p/<id>.html` pages and sitemap entries on https://stermontarcade.co.ke.
4. Replace market-reference costs with real supplier costs when known.
5. Do not use the old temporary `upload-photos` helper.

Branch: `wip-electronics-posting-20261102` (note-only). Merge the note to `main` once photos and live pages are verified.
