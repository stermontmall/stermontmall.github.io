# HANDOFF-live - current progress (newest wins over everything)

Reset on 2026-11-10 (Africa/Nairobi). The previous long log (~319 KB) is still in git history: `git show 82a4e0a503537365fdfdf2bacce7f401802314d0:HANDOFF-live.md`. Older history also lives in `HANDOFF.md`.

Keep this file to about one page. Update it after every step (commit, merge, finding, blocker).

## Done
- 2026-11-10: HANDOFF-live.md reset to a short template (merged to main).

## In progress
- Branch `wip-lock-add-product-photo`: `supabase/sql/lock-add-product-photo.sql` written, NOT yet applied to Supabase and NOT merged. Waiting for the owner's go-ahead to run it.

## Next
- [ ] Security: apply `supabase/sql/lock-add-product-photo.sql` (revokes EXECUTE on the 4-argument `public.add_product_photo` from public/anon/authenticated; the 3-argument overload is already locked). Then re-run the Supabase security advisor and confirm it is gone. Merge the branch after that.
- [ ] Phone bug: `/?product=<slug>` deep link sits on the loader spinner. Suspect `mobile-shell/app.js` (commit 2d9e9e9 "Shorten mobile product deep-link critical path") or a stale cached script. Test in a private tab first.
- [ ] Page builder asks Supabase for `products.gtin` and `products.mpn`, which do not exist (400 errors in API logs). Add the columns or drop them from the select in `generate-products.mjs`.

## Blocked
- (none)

## Decisions
- Keep current product URLs `/p/<slug>.html` (no rename: GitHub Pages cannot send 301 redirects).
