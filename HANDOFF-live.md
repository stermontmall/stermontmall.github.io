# HANDOFF-live - current progress (newest wins over everything)

Reset on 2026-11-10 (Africa/Nairobi). The previous long log (~319 KB) is still in git history: `git show 82a4e0a503537365fdfdf2bacce7f401802314d0:HANDOFF-live.md`. Older history also lives in `HANDOFF.md`.

Keep this file to about one page. Update it after every step (commit, merge, finding, blocker).

## Done
- (nothing logged since reset)

## In progress
- Branch `wip-reset-handoff-live`: this reset. NOT merged to main.

## Next
- [ ] Security: `public.add_product_photo` is SECURITY DEFINER and executable by `anon` with no staff check. Restrict it to staff (revoke EXECUTE from anon/authenticated or add an `is_staff()` check). Show the migration to the owner before running it.
- [ ] Phone bug: `/?product=<slug>` deep link sits on the loader spinner. Suspect `mobile-shell/app.js` (commit 2d9e9e9 "Shorten mobile product deep-link critical path") or a stale cached script. Test in a private tab first.
- [ ] Page builder asks Supabase for `products.gtin` and `products.mpn`, which do not exist (400 errors in API logs). Add the columns or drop them from the select in `generate-products.mjs`.

## Blocked
- (none)

## Decisions
- Keep current product URLs `/p/<slug>.html` (no rename: GitHub Pages cannot send 301 redirects).
