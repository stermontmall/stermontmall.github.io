# Product posting handoff — 2026-11-02

## Scope
Owner requested five new items, KSh market-reference prices, COGS 15% below selling price, opening stock 1,000, low-stock alert 20, and featured placement.

## Database verification
All five records exist in Supabase project `oewvtbnmyombbtggamor` and are currently `active=true`, `featured=true`, stock 1,000, low_at 20. Each has a product description and SEO title.

| Product | Selling price (KES) | COGS at 85% (KES) |
|---|---:|---:|
| Mos-Kill Electric Liquid Vaporizer Kit with 35 ml Refill | 1,999.00 | 1,699.15 |
| Mos-Kill Green Mosquito Coils, 10 pieces / 125 g | 500.00 | 425.00 |
| Shenke Cockroach Killer Powder Sachet, 1 g | 219.00 | 186.15 |
| KMAX Italy 20 L Manual Knapsack Sprayer | 2,345.00 | 1,993.25 |
| Solar-Powered Outdoor Wasp Traps, 3-piece set | 1,576.00 | 1,339.60 |

The five COGS values were verified against `round(price * 0.85, 2)`.

## Photo handoff
Library archive: `stermont-product-photos-optimized(1).zip` (also an earlier duplicate named `stermont-product-photos-optimized.zip`). It contains five matching JPEGs:
- `mos-kill-electric-vaporizer.jpg`
- `mos-kill-green-coils.jpg`
- `shenke-cockroach-killer.jpg`
- `kmax-20l-knapsack-sprayer.jpg`
- `solar-insect-traps-3pc.jpg`

The images were extracted and visually checked against the five product names. However, none of the five image URLs has yet been attached to the corresponding `products.images` array; the five active records still have empty image arrays. Do not mark the photo handoff complete until the files are uploaded to the public `product-images` bucket (or another stable public image host) and the records point to the verified URLs. Do not use the old temporary `upload-photos` helper: its hard-coded allow-list/passcode is for a different batch and is not suitable for these products.

## Build / live verification
The GitHub repository is `stermontmall/stermontmall.github.io`, default branch `main`. The product page workflow `.github/workflows/product-pages.yml` rebuilds from active Supabase products every three hours. The new records were added at approximately 2026-11-02 11:41 Nairobi time, shortly before the next scheduled build. Generated product files and live HTML were not verified in this handoff. After the next successful product-pages run, verify the five `/p/<slug>.html` pages, images, H1/title/meta description, canonical, Product JSON-LD, and sitemap entries on `https://stermontarcade.co.ke`.

## Wider catalogue snapshot
At this check: 263 total products; 230 active. Across all products, 7 have no images, 2 have no descriptions, and 68 have no owner-supplied `seo_title`. Among active products: 5 have no images (the five new items), 0 have empty descriptions, 35 have no owner-supplied `seo_title`, and 34 have cost recorded as zero. The generator has fallback SEO title logic; an empty owner `seo_title` field is not by itself proof that the live page has no title. Do not invent supplier costs for the 34 zero-cost items.

## Remaining actions
1. Upload the five inspected JPEGs to stable public storage and update the five product image arrays.
2. Confirm the scheduled product-pages workflow succeeds.
3. Check all five live product pages and sitemap entries; only then mark posting handoff complete.
4. Separately reconcile the 34 active zero-cost records with actual supplier invoices/costs; do not apply the 85% estimate to unrelated catalogue items.
