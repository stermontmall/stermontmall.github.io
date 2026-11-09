# HANDOFF-live - current progress (newest wins over everything)

Reset on 2026-11-10 (Africa/Nairobi). The previous long log (~319 KB) is still in git history: `git show 82a4e0a503537365fdfdf2bacce7f401802314d0:HANDOFF-live.md`. Older history also lives in `HANDOFF.md`.

Keep this file to about one page. Update it after every step (commit, merge, finding, blocker).

## Done
- 2026-11-10: HANDOFF-live.md reset to a short template (merged to main).
- 2026-11-10: APPLIED `supabase/sql/lock-add-product-photo.sql` to the live Supabase project. The 4-argument `public.add_product_photo` is now executable only by postgres and service_role (verified in `proacl`). Security advisor re-run: it no longer appears in the anon/authenticated lists (anon 7 -> 6, authenticated 11 -> 10). Branch `wip-lock-add-product-photo` holds the SQL file; merge it so the repo matches the database.

## In progress
- (none)

## Next
- [ ] Merge `wip-lock-add-product-photo` into main (adds the SQL file and this note; no site code changes).
- [ ] Phone bug: `/?product=<slug>` deep link sits on the loader spinner. Suspect `mobile-shell/app.js` (commit 2d9e9e9 "Shorten mobile product deep-link critical path") or a stale cached script. Test in a private tab first.
- [ ] Page builder asks Supabase for `products.gtin` and `products.mpn`, which do not exist (400 errors in API logs). Add the columns or drop them from the select in `generate-products.mjs`.
- [ ] Housekeeping: about 70 old backup tables (schema `archive` and `public.*_backup_*`) have RLS on but no policies; archive or drop the ones no longer needed.

## Blocked
- (none)

## Decisions
- Keep current product URLs `/p/<slug>.html` (no rename: GitHub Pages cannot send 301 redirects).
- Remaining anon-callable SECURITY DEFINER functions (check_voucher, track_order, rate_order_*, recent_purchases, is_staff) are customer-facing and left as they are.
