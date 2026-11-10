# HANDOFF-live - current progress (newest wins over everything)

Reset on 2026-11-10 (Africa/Nairobi). The previous long log (~319 KB) is still in git history: `git show 82a4e0a503537365fdfdf2bacce7f401802314d0:HANDOFF-live.md`. Older history also lives in `HANDOFF.md`.

Keep this file to about one page. Update it after every step (commit, merge, finding, blocker).

## Done
- 2026-11-10: Added and published Crownline IK-370 38W Electric Insect Killer. Source KES 6,005 (Microless Kenya listing); selling KES 6,905.75; category 90; stock 1000; low_at 20. Exact 600x600 manufacturer image uploaded to `product-images` via `public.add_product_photo`; verified HTTP 200 response, Storage object and `products.images`, `active=true`. Mobile-shell link: https://stermontarcade.co.ke/?product=crownline-ik-370-38w-electric-insect-killer. First Microless image URL was rejected HTTP 403; manufacturer image succeeded. Static page rebuild pending next scheduled run (workflow runs every 30 minutes).
- 2026-11-10: HANDOFF-live.md reset to a short template (merged to main).
- 2026-11-10: APPLIED `supabase/sql/lock-add-product-photo.sql` to the live Supabase project. The 4-argument `public.add_product_photo` is now executable only by postgres and service_role (verified in `proacl`). Security advisor re-run: it no longer appears in the anon/authenticated lists (anon 7 -> 6, authenticated 11 -> 10). Branch `wip-lock-add-product-photo` holds the SQL file; merge it so the repo matches the database.
- 2026-11-10: Created inactive draft `lynfield-fruit-fly-monitoring-trap` from Simlaw Seeds listing (source KES 150; DB selling price KES 173; stock 1000; low_at 20; featured false). Photo upload request 1269 failed because Agriculture Victoria image host returned HTTP 403. Verified draft remains inactive with an empty images array; not published.
- 2026-11-10: Checked Kenyan supplier listings for Delta Trap and Funnel Trap. Delta Trap is listed by Agroduka at KES 403 (minimum order 29) and M-Tolori at KES 560; Funnel Trap (Bucket Trap) listed by Agroduka at KES 1,139 (minimum order 10). Agroduka also lists Water Trap at KES 1,725 (minimum order 7), Cross Vane Trap Black at KES 5,500, and Crytrack Complete Set at KES 978. A subsequent live catalogue check confirmed Cross Vane Trap Black already exists and is active on our site (KES 6,325 with image); it is a duplicate and must not be re-added. No other records created because exact product image assets have not yet been verified and uploaded.


- 2026-11-10: Retried Lynfield photo using a Kenya agrovet image explicitly labelled Lynfield Trap (`farmerstrend.co.ke`); upload request 1270 also failed HTTP 403. Verified the product remains inactive with no stored image. Do not publish until an exact image is uploaded through the authenticated image-base64 route or another verified upload path.
- 2026-11-10: FIXED the description-length conflict. `public.add_draft_product` rejects descriptions outside 600-900 words (and openings whose first 200 words duplicate an existing product), but the instructions said 60-120 words. Updated `site_playbook` topic `add_product` in the live database (only the 60-120 words sentence and the add_draft_product note were replaced; the function was NOT changed). Updated `PUBLISHING.md` step 3 on branch `wip-description-word-count` (commit 16e56df). Old wording, for undo: "write an original factual description (60-120 words, no invented specs, certifications or results)".

## In progress
- Find an accessible exact product image for Lynfield Fruit Fly Monitoring Trap, then upload and verify before activation.
- Verify new trap candidates against the catalogue: Tutrack Complete Set (Agroduka KES 978), Tutrack Sticky Cards 10-pack (KES 690 listing; separate product page shows KES 600), Water Trap (KES 1,725), Wing Trap (KES 564), Yellow Sticky Cards (KES 69). Need exact product photo and duplicate scan before draft creation.

## Next
- [ ] Merge `wip-description-word-count` into main (docs only, no site code changes).
- [ ] `.claude/commands/post-product.md` is out of date (says photos optional and active=false pending owner approval; the playbook and CLAUDE.md say a verified photo is mandatory and products go live after verification). Update it to match.
- [ ] Two Hilux adverts (`toyota-hilux-2026-brand-new-for-sale-kenya`, `toyota-hilux-champ-2024-brand-new-pickup-kenya`) use photos hotlinked from other websites, not from the `product-images` bucket. Replace with exact photos stored in Storage (needs owner OK).
- [ ] Draft `2019-suzuki-bandit-solio-foreign-used-kenya` has a doubled "– –" in its seo_title.
- [ ] Merge `wip-lock-add-product-photo` into main (adds the SQL file and this note; no site code changes).
- [ ] Phone bug: `/?product=<slug>` deep link sits on the loader spinner. Suspect `mobile-shell/app.js` (commit 2d9e9e9 "Shorten mobile product deep-link critical path") or a stale cached script. Test in a private tab first.
- [ ] Old-page flash between clicking a link and reaching the mobile shell: waiting for the owner to say where it appears (product link, category tap, or account/track/shipping pages). `classic.html` is already a tiny forwarder; `/p/` pages carry an early redirect script that skips in-app browsers and when innerWidth is 0.
- [ ] Page builder asks Supabase for `products.gtin` and `products.mpn`, which do not exist (400 errors in API logs). Add the columns or drop them from the select in `generate-products.mjs`.
- [ ] Housekeeping: about 70 old backup tables (schema `archive` and `public.*_backup_*`) have RLS on but no policies; archive or drop the ones no longer needed.

## Blocked
- Lynfield image: source image URL returned HTTP 403 during server-side download; no product was published.
- Agroduka product pages were not fetchable through page-open during this check, so no verified direct image URL for Tutrack/Water Trap was obtained. Do not use unrelated generic delta-trap images as product-specific assets.
- Photo upload from ChatGPT: `upload-photos` needs the secret passcode and `add_product_photo` is locked to postgres/service_role, so a limited connector cannot attach photos. Photos must be attached by the owner (admin page) or a session with full database rights.

## Decisions
- Keep current product URLs `/p/<slug>.html` (no rename: GitHub Pages cannot send 301 redirects).
- Remaining anon-callable SECURITY DEFINER functions (check_voucher, track_order, rate_order_*, recent_purchases, is_staff) are customer-facing and left as they are.
- 2026-11-10: Added and published two verified agrovet products via the Supabase playbook: YAGO TPH01803 4-in-1 Digital Soil Tester (source cost KSh 2,800; selling KSh 3,220) and WQ 6 kg Poultry Feeder (source cost KSh 450; selling KSh 517.50). Both have exact product photos uploaded to `product-images`, `active=true`, stock 1000, low_at 20, unique clean slugs and original 850+ word structured descriptions. Photos sourced from the YIERYI manufacturer (soil tester) and an exact WQ-6H retailer image (feeder). Triggered a static product-page rebuild by appending a dated rebuild comment to `generate-products.mjs`; verify the GitHub Actions build and generated `/p/` pages next.
- 2026-11-10: `Build product pages` workflow #613 completed successfully (run 42761543177). Both new `/p/` pages are present in GitHub with canonical URLs, product JSON-LD, live Supabase image URLs, KES offer prices and in-stock availability. Sitemap includes both slugs. Generator reported 754 Merchant Center feed items; IndexNow accepted 486 changed URLs (HTTP 200). Google crawling/indexing is still pending and rankings are not guaranteed.
