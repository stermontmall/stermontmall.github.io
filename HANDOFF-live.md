# HANDOFF-live — current project state
Updated 2026-11-10 (Africa/Nairobi). Older detail remains in Git history and HANDOFF.md.

## Publishing rules
- Use the live Supabase project `oewvtbnmyombbtggamor`; public image bucket: `product-images`.
- Before creating a product, scan the live catalogue for duplicates and verify the exact Kenyan supplier listing, current KES source price, product facts and matching image.
- Create with `public.add_draft_product`: unique name, exact source cost, category, unit, source URL and a unique factual 600–900-word description. The function applies the 15% price rule internally, creates stock 1000 / low_at 20, featured false, and leaves the product inactive.
- Attach the exact product photo through `public.add_product_photo` to `product-images`; verify HTTP 200, `ok=true`, `live=true`, one image and the public URL in `products.images`. Activate only after image verification.
- Do not change price/cost/description during photo-only tasks. Never mention markup, profit, supplier cost or source-price calculations in customer-facing copy.
- Static product URLs are `/p/<slug>.html`; rebuild pages and verify the product sitemap after catalog or photo changes.

## Done — latest batch
- 2026-11-10: 20 agrovet products are active in Supabase with one image each, 600–900-word descriptions, stock 1000 and low_at 20. Cost/price pairs match the database rule. Products: Basil Seeds (Starke Ayres); Garden Mix Herb Seeds; Fugo Dairy Meal 50kg; Oreganum Herb Seeds; Tsavo WE 4141 Hybrid Maize 2kg; Dash F1 Baby Spinach; DKC80-33 Hybrid Maize 2kg; SC Duma 43 Hybrid Maize 2kg; Mavuno Bora Hermetic Grain Bag 100kg; Chives Herb Seeds; Catnip Herb Seeds; Rio Grande Tomato Seeds 10g; Collard Ahadi F1 5g; Simlaw Long Red Cayenne 10g; Radish Cherry Belle 10g; Parsley Plain Herb Seeds; Fordhook Giant Swiss Chard 25g; Marigold Crackerjack; Chamomile Simlaw 10g; SC Tembo 73 Hybrid Maize 2kg.
- 2026-11-10: Build product pages workflow #625 succeeded (run 42880150870). All 20 product pages were present in `p/` and all 20 slugs were confirmed in `sitemap-products.xml`. GitHub Pages deployment #2021 succeeded (run 42880306524). This build occurred before the photo refresh below; rebuild again after it.
- 2026-11-10: Replaced 7 images for the batch through `public.add_product_photo(..., true, false)`; all returned HTTP 200, `ok=true`, `live=true`, `photos=1`: Mavuno Bora, Rio Grande Tomato, Fugo Dairy Meal, Chamomile, Fordhook Giant, Marigold Crackerjack and SC Tembo 73. Chives replacement was rejected by source host with HTTP 403; its existing image remains and still needs a better accessible exact source. No prices, costs or descriptions were changed during photo replacements.
- 2026-11-10: Also published YAGO TPH01803 4-in-1 Digital Soil Tester, WQ 6 kg Poultry Feeder, Crownline IK-280 14W, Crownline IK-370 38W, Power King 6-Way Extension Cable and other verified catalogue additions documented in Git history. Preserve their records and avoid duplicates.
- 2026-11-10: `public.add_product_photo` execute permission is restricted to postgres/service_role. Current connected SQL session is postgres; use the RPC rather than direct table-image edits.

## In progress / next
- Trigger and verify a fresh Build product pages run after the 7 photo replacements; confirm the updated image URLs appear in generated `/p/` pages and `sitemap-products.xml`.
- Find an accessible exact Starke Ayres Chives seed-packet image; do not substitute an unrelated herb photo.
- Find an accessible exact image for the inactive Lynfield Fruit Fly Monitoring Trap draft; keep it inactive until photo upload succeeds.
- Update `.claude/commands/post-product.md` to match the verified-photo-before-activation rule and the 600–900-word function requirement.
- Merge documentation/SQL branches `wip-description-word-count` and `wip-lock-add-product-photo` if still open.
- Replace hotlinked photos on the two Hilux adverts with exact images stored in `product-images`.
- Investigate mobile-shell product deep-link loader issue and the page builder's missing `products.gtin` / `products.mpn` fields.
- Review old backup tables only after confirming they are unused.

## Blocked / cautions
- Lynfield image sources previously returned HTTP 403; do not activate that draft until a matching photo is stored.
- Chives image source returned HTTP 403; existing image is retained, so do not claim its photo was replaced.
- Google crawling and ranking are not guaranteed by a successful build or sitemap ping.
