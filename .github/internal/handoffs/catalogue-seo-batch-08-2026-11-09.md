# Catalogue SEO batch 08 — 2026-11-09

Owner instruction: “Deal with the next 30.”

## Supabase changes
- [x] Selected the next 30 active products with descriptions under 600 words, in catalogue order.
- [x] Expanded all 30 product descriptions; SQL verification confirms every description is 600–800 words (observed range 646–693).
- [x] Updated SEO names and Kenya-focused SEO titles; all 30 titles are 60 characters or fewer.
- [x] Backed up all 30 original descriptions in `public.description_backup`, batch `catalogue-seo-600-800-batch-08`.
- [x] Verified all 30 remain active, stock=1000, low_at=20, featured=true, and retain at least one image reference.
- [x] Preserved product IDs, slugs, prices and existing image references. No product rows were created or deleted.
- [x] Fresh catalogue count: 30 active products remain below 600 words; 242 active products now have 600–800-word descriptions.

## Products updated
### Bajaj Boxer BM150
- `bajaj-boxer-bm150-oil-filter-cap-fresh`
- `bajaj-boxer-bm150-side-stand-kit-fresh`
- `bajaj-boxer-bm150-chain-sprocket-kit-fresh-20261108`
- `bajaj-boxer-bm150-piston-ring-set-36pf0116-fresh`
- `bajaj-boxer-bm150-air-filter-element-ja581006-fresh-20261108`
- `bajaj-boxer-bm150-clutch-cable-pf161212-fresh-20261108`
- `bajaj-boxer-bm150-oil-filter-element-dd121181-fresh-20261108`

### TVS HLX
- `tvs-hlx-150-4gear-chain-sprocket-kit-szn6320660-fresh`
- `tvs-hlx-125-150-choke-cable-n5170130-fresh-20261108`
- `tvs-hlx-125-150-clutch-bearing-6201-420602000-fresh-20261108`
- `tvs-hlx-125-150-one-way-clutch-r1060110-fresh-20261108`
- `tvs-hlx-125-150-speed-cable-n6170100-fresh-20261108`
- `tvs-hlx-125-150-speedometer-gear-fresh-20261108`
- `tvs-hlx-125-150-throttle-cable-n5170120-fresh-20261108`
- `tvs-hlx-150-5gear-front-brake-cable-n5170020-fresh-20261108`
- `tvs-hlx-150-clutch-assembly-primary-gear-2060t132-fresh-20261108`
- `tvs-hlx-150-clutch-boss-hub-disc-2061t131-fresh-20261108`
- `tvs-hlx-150-clutch-plate-set-fresh-20261108`

### Pest-control fogging equipment
- `airofog-u260-ulv-cold-fogger-20261108`
- `longray-ts35a-thermal-fogger-20261108`
- `longray-ts75l-thermal-fogger-20261108`
- `pan-bf150-stainless-steel-thermal-fogger-20261108`
- `vectorfog-by100-mini-thermal-fogger-20261108`
- `vectorfog-by200-mini-butane-thermal-fogger-20261108`
- `vectorfog-c100-mobile-ulv-cold-fogger-20261108`
- `vectorfog-c150-plus-ulv-cold-fogger-20261108`
- `vectorfog-c20-plus-ulv-cold-fogger-20261108`
- `vectorfog-h100sf-portable-thermal-fogger-20261108`
- `vectorfog-h200sf-thermal-fogger-20261108`
- `vectorfog-h300sf-quad-bike-thermal-fogger-20261108`

## Important verification limits
- Existing product image references were retained; this batch did not visually inspect image-to-model matching, upload new photos, or verify image licensing.
- Motorcycle fitment remains subject to exact model year, engine version, part reference and physical dimensions. Brake/throttle work requires qualified mechanic checks.
- Fogging equipment specifications must be checked against the exact model nameplate and current manufacturer manual. Chemical application must follow the product label/SDS and current PCPB registration; do not infer a safe dose from tank size.
- Static HTML regeneration, canonical tags, Product JSON-LD, sitemap inclusion, IndexNow notification and GitHub Pages deployment have not been verified for this batch. Google indexing and ranking are not claimed.
- Customer-facing links should use `https://stermontarcade.co.ke/?product=<slug>` after confirming the product remains active; do not send static `/p/` URLs as customer links.

## Next
- Continue with the next 30 active products under 600 words.
- After the catalogue description batches, verify the product-pages workflow, generated titles/meta, canonical URLs, Product JSON-LD and sitemap entries.
