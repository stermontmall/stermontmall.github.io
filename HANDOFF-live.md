# HANDOFF-live - current progress (newest wins over everything)

Reset on 2026-11-10 (Africa/Nairobi). The previous long log (~319 KB) is still in git history: `git show 82a4e0a503537365fdfdf2bacce7f401802314d0:HANDOFF-live.md`. Older history also lives in `HANDOFF.md`.

Keep this file to about one page. Update it after every step (commit, merge, finding, blocker).

## Done
- 2026-11-10: HANDOFF-live.md reset to a short template (merged to main).
- 2026-11-10: APPLIED `supabase/sql/lock-add-product-photo.sql` to the live Supabase project. The 4-argument `public.add_product_photo` is now executable only by postgres and service_role (verified in `proacl`). Security advisor re-run: it no longer appears in the anon/authenticated lists (anon 7 -> 6, authenticated 11 -> 10). Branch `wip-lock-add-product-photo` holds the SQL file; merge it so the repo matches the database.
- 2026-11-10: Created inactive draft `lynfield-fruit-fly-monitoring-trap` from Simlaw Seeds listing (source KES 150; DB selling price KES 173; stock 1000; low_at 20; featured false). Photo upload request 1269 failed because Agriculture Victoria image host returned HTTP 403. Verified draft remains inactive with an empty images array; not published.
- 2026-11-10: Checked Kenyan supplier listings for Delta Trap and Funnel Trap. Delta Trap is listed by Agroduka at KES 403 (minimum order 29) and M-Tolori at KES 560; Funnel Trap (Bucket Trap) listed by Agroduka at KES 1,139 (minimum order 10). Agroduka also lists Water Trap at KES 1,725 (minimum order 7), Cross Vane Trap Black at KES 5,500, and Crytrack Complete Set at KES 978. A subsequent live catalogue check confirmed Cross Vane Trap Black already exists and is active on our site (KES 6,325 with image); it is a duplicate and must not be re-added. No other records created because exact product image assets have not yet been verified and uploaded.


- 2026-11-10: Retried Lynfield photo using a Kenya agrovet image explicitly labelled Lynfield Trap (`farmerstrend.co.ke`); upload request 1270 also failed HTTP 403. Verified the product remains inactive with no stored image. Do not publish until an exact image is uploaded through the authenticated image-base64 route or another verified upload path.

## In progress
- Find an accessible exact product image for Lynfield Fruit Fly Monitoring Trap, then upload and verify before activation.
- Verify new trap candidates against the catalogue: Tutrack Complete Set (Agroduka KES 978), Tutrack Sticky Cards 10-pack (KES 690 listing; separate product page shows KES 600), Water Trap (KES 1,725), Wing Trap (KES 564), Yellow Sticky Cards (KES 69). Need exact product photo and duplicate scan before draft creation.

## Next
- [ ] Merge `wip-lock-add-product-photo` into main (adds the SQL file and this note; no site code changes).
- [ ] Phone bug: `/?product=<slug>` deep link sits on the loader spinner. Suspect `mobile-shell/app.js` (commit 2d9e9e9 "Shorten mobile product deep-link critical path") or a stale cached script. Test in a private tab first.
- [ ] Page builder asks Supabase for `products.gtin` and `products.mpn`, which do not exist (400 errors in API logs). Add the columns or drop them from the select in `generate-products.mjs`.
- [ ] Housekeeping: about 70 old backup tables (schema `archive` and `public.*_backup_*`) have RLS on but no policies; archive or drop the ones no longer needed.

## Blocked
- Lynfield image: source image URL returned HTTP 403 during server-side download; no product was published.
- Agroduka product pages were not fetchable through page-open during this check, so no verified direct image URL for Tutrack/Water Trap was obtained. Do not use unrelated generic delta-trap images as product-specific assets.

## Decisions
- Keep current product URLs `/p/<slug>.html` (no rename: GitHub Pages cannot send 301 redirects).
- Remaining anon-callable SECURITY DEFINER functions (check_voucher, track_order, rate_order_*, recent_purchases, is_staff) are customer-facing and left as they are.
