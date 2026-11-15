# Live handoff — technical SEO

Date: 2026-11-15 (Africa/Nairobi)
Repository: stermontmall/stermontmall.github.io
Working branch: wip/seo-clean-2026-11-15

## Done
- Created a clean working branch from `main`; the earlier branch `wip/technical-seo-kenya-2026-11` is 100 commits ahead of main and contains unrelated changes, so it will not be merged or deployed.
- Audited the canonical domain, homepage metadata/schema, robots.txt, sitemap.xml, product/category generator, services generator/data, service hub, shipping page, service guide index and current navigation script.
- Updated `generate-products.mjs` in commit `875963bb9e9480a8b24a4f7bebf340d6d4a5aefa` so categories with fewer than five products get `noindex, follow`.
- Updated the category generator so `stermont-cars-for-sale` and `mens-fashion` are emitted at canonical root destinations `/cars-for-sale.html` and `/fashion.html`, with noindex redirect stubs at their old `/c/` URLs. The old paths are excluded from the generated category URL list; the destination paths are included.
- No changes have been merged to main or deployed. The live site remains untouched.

## In progress
- Validate the generator change against the repository's build workflow and link checker.
- Review service-page source data and county-page generator before adding the requested service and county pages.
- Review navigation priority changes without altering mobile-shell interactions or styles.

## Blocked / limitations
- This environment has GitHub repository access but no checked-out working tree to run Node locally.
- GitHub Actions have not yet been run for this branch. Do not claim build, schema or link checks passed until an actual run reports success.
- The existing `HANDOFF-live.md` and `HANDOFF.md` referenced in `CLAUDE.md` were not present on main; this file establishes the live handoff on the working branch.

## Next
1. Run the product-page workflow's existing Node tests and build on a review branch, without changing workflow files.
2. Confirm the two destination category pages are generated and old URLs redirect correctly.
3. Implement the remaining service/county pages in their source generators/data, then run link and sitemap checks.
4. Open a review PR only after the branch contains only the intended SEO commits and all available checks have been run.
5. Merge to main only after review and successful verification; then check the canonical live URLs.

