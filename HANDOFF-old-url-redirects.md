# HANDOFF: old indexed product URLs that now 404 (2026-11-27)

Branch: `fix-old-product-redirects` (off main 6b53901). Site: https://stermontarcade.co.ke (GitHub Pages, so no real 301s).

## Problem
After the Supabase quota outage and move to Neon (project `restless-shape-79120240`, "stermont-arcade-temporary"), the product catalogue changed. Google still shows many old `/p/<slug>.html` URLs. They return `404.html` ("broken page").

## Findings (from Search Console "Performance on Search" export, last 3 months, 2026-11-27)
- 802 product URLs have impressions. 128 are active in Neon, 3 are inactive, **671 are not in Neon** (10,108 impressions, 210 clicks). The export is capped at 1,000 rows per report, so low-traffic old URLs are missing from it.
- Not in Neon, by group: motorcycle spares (Bajaj Boxer / TVS HLX) 140 URLs, vehicles 9, agrovet about 314, pest control about 132 (slug-keyword classification, not exact).
- Most are deleted products, not renames. Only about 13 had a clean equivalent.
- Existing convention: small redirect pages in `p/` with title "Redirecting…", canonical and `meta refresh 0`. `seo-fixes.mjs` skips pages containing "Redirecting", so the build leaves them alone. About 660 UUID-named files in `p/` already work this way.
- Repo rule (SEO-ARCHITECTURE.md section 9): no slug changes or removed indexed pages without a tested redirect and sitemap update.

## Done this session
1. Branch `fix-old-product-redirects` has 28 new redirect pages in `p/` (all new files, nothing modified). These are the agrovet and pest control URLs with 2+ clicks.
   - 13 go to a same or closest product (listed in the table below).
   - 15 go to a relevant category page in `/c/`.
2. Neon `product_slug_redirects` (columns old_slug, product_id) had 0 rows. 13 rows inserted for the product renames (old_slug to products.id). Nothing else in Neon was changed.
3. **Pull request**: the create form was shown to the user. It was NOT confirmed submitted when this was written. Check `is:pr head:fix-old-product-redirects`. If missing, create a PR into main titled "Redirect 28 high-click old agrovet and pest control URLs".

| Old slug | Redirects to (/p/) |
|---|---|
| stainless-steel-bird-pigeon-spikes-50cm | stainless-steel-bird-spikes-50cm-strip |
| zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre | zagro-ultraxide-liquid-disinfectant-1l |
| advance-termite-monitoring-bait-station (+ -20261108) | basf-advance-termite-bait-stations-10-pack |
| mosquito-window-net-screen | velcro-window-mosquito-net |
| bugnil-20ec-insecticide-25-ml | bugnil-20-ec-25ml |
| rodilon-wax-blocks-10-g | rodilon-wax-blocks-10g |
| bat-crp-bat-repellent-1-litre | bat-repellant-powder-250g (closest; liquid vs powder, confirm) |
| fly-glue-boards-15pcs | genus-universal-fly-glue-boards-15-pack |
| bedlam-200sl-insecticide-100-ml | bedlam-200sl-insecticide-100ml |
| tatua-advion-cockroach-gel-bait-30-g | tatua-advion-cockroach-gel-bait-30g |
| syngenta-tatua-rat-and-mice-poison-blocks | tatua-klerat-wax-blocks-100g |
| sulphate-of-potash-sop-fertilizer-25kg | solusop-potassium-sulphate-fertilizer-25kg |

Category fallbacks (15): alonze, amito, air-chopper, darvin, abasi to `/c/crop-insecticides.html`; revus to `/c/fungicides.html`; salinomycin to `/c/veterinary-drugs.html`; kynofos to `/c/agrovet.html`; solubor to `/c/fertilizers.html`; ed21-30w-fly-catcher to `/c/insect-light-traps-uv-lamps.html`; queen mattress and polti steamer to `/c/bed-bug-killers.html`; snake tongs and clothes moth trap to `/c/pest-control-fumigation.html`; uv365 flashlight to `/c/pest-monitoring-inspection-tools.html`.

## Not done (pick up here)
1. **Merge the PR**, then open 2-3 old URLs on the live site to confirm they forward. Then in Search Console use URL Inspection and Request Indexing for the 13 product redirects.
2. **Next tier: 64 agrovet and pest control URLs with exactly 1 click.** Same method: find an equivalent in Neon (compare slug words; accept only same product, brand and pack) or fall back to the nearest `/c/` category.
   - Likely same-product candidates to check first: `fuko-kil-rat-poison-25-g` to `fuko-kil-rodenticide-25g`; `velcro-windows-mosquito-net` to `velcro-window-mosquito-net`; `mono-ammonium-phosphate-map-fertilizer-25kg` to `map-mono-ammonium-phosphate-fertilizer-25kg`; `jembe-star-500-sl-herbicide-1-litre` to `jembe-star-500sl-herbicide-1-litre`; `pantry-moth-pheromone-trap` to `pantry-moth-trap`; `termidor-96-sc-1-litre` to `termidor-96sc-termiticide-1l`; `kelpak-seaweed-biostimulant-1l` (check); `aminika-wh508-hybrid-maize-seeds-2kg` to `aminika-wh508-maize-seeds-2kg`.
   - Remaining 1-click slugs (likely deleted, use category fallback): zetabestox-100-ec, tylodoxi-200, vectoclor-plus, agvanta-500-sc, optimizer, azolla-seeds, albafas-10, tower-extreme-680, levafas-diamond, ampligo-150, escort-19ec, ransom-600, impress-720, promax-20-ec, mancozeb-emthane, gut-bio, chlorpyrifos-dursban, ruiru-urea-46, dithane-mancozeb, orondis-ultra, mospilan-20sp, azatone, quadris-50wg, amistar-xtra, malathion-50, alto-100, actellic-25ec, balcan-700wg, parsley/spinach/marigold seeds, farmmil-72wp, sulban-48ec, d-amine-72, altair-50, aminika-wh403, skipper-72, pioneer-p2848w, total-touch-250, chicken wire mesh; pest: shenke powder sachet, miratex pellets, fumakilla vape mat refill, rodirid wax blocks, rafiki fly catcher, uv replacement tubes, fly paper pack, stufit copper mesh, rentokil lumnia, duotrap, storm block, familly aerosol, tronic ik-gc20, catchmaster 909, yellow glue roll.
3. **Motorcycle spares (140 URLs, 3,077 impressions, 54 clicks) and vehicles (9 URLs)**: ask the owner whether they are coming back. If yes, restore at the same slugs. If no, redirect to the nearest category (`/c/motorcycle-accessories.html` exists in the site per Search Console; verify it is live before pointing at it) or `/c/stermont-cars-for-sale.html`.
4. **Zero-click tail (about 350 agrovet/pest URLs) and non-agro/pest groups** (electronics, fashion, kids): low priority. A generic fallback in `404.html` for `/p/*` (JS redirect to the best category by slug keywords, noindex stays) would cover all of them at once.
5. **Get the full old URL list**: Search Console Pages report "Not found (404)" export, or `git log -- sitemap-products.xml` for older sitemaps (the export used here is capped at 1,000 rows).
6. Check that `sitemap-products.xml` lists only live URLs, and that the HANDOFF-remove-supabase.md branch (`wip-remove-supabase`) is not regenerating or deleting `p/` pages.
7. Expect Google to take weeks to drop old URLs. Keep redirect pages for at least 12 months.

## Method notes (to repeat quickly)
- Classify export URLs against Neon by comparing `left(md5(slug),6)` hashes (avoids pasting 800 slugs): `select string_agg(left(md5(slug),6)||case when active then 'a' else 'i' end, ',') from products`.
- Match old to new slugs with a word-overlap (Jaccard) query on `string_to_array(slug,'-')`. Scores below about 0.6 were mostly different brands (e.g. Agvanta to Bradley), so confirm by hand.
- Redirect page template (keep the word "Redirecting" in the title):
  `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="URL"><meta http-equiv="refresh" content="0;url=URL"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><p>This product moved. <a href="URL">Continue</a>.</p></body></html>`
- Files made this session (spreadsheets of missing URLs) lived only in the chat sandbox and are not in the repo; re-export from Search Console if needed.
