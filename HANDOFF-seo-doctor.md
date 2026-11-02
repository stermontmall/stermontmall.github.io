# HANDOFF: SEO Doctor fix (branch wip-seo-doctor)

## Done
- Database (applied live): `seo_content_proposals.target_type` check now also allows `page`, so home/About/FAQ/guide pages can be saved. Before, the function accepted that type but the table rejected it.
- `seo-doctor.js`: scan now sends every page scoring under 100 (weakest first, max 200) to `seo-research` in batches of 8, instead of only the 8 weakest.
- `seo-doctor.js`: page type is now decided by URL prefix (`/p/`, `/c/`, `/blog/`, `/services/`) instead of `includes`.
- `seo-doctor.js`: fixed `\\s+` regex that left raw whitespace in H1/H2 text.
- `seo-doctor.js`: status shows how many pages score 100/100, how many are hidden, and how many need improvement.

## Left
- Merge `wip-seo-doctor` to main after a test scan in the admin (SEO Doctor tab), then bump `seo-doctor.js?v=18` to `v=19` in admin.html so browsers load the new file.
- Approving a draft still does not change the live page; an auto-apply step for titles/descriptions is not built.
- `seo-review` function was not inspected or changed.

## Decisions
- Edge function `seo-research` left unchanged (it already accepts 8 targets per call and `page`).
