# Live handoff — technical SEO

Date: 2026-11-15 (Africa/Nairobi)
Repository: stermontmall/stermontmall.github.io
Working branch: wip/seo-batch1-2026-11-15

## Done
- Created a clean working branch from `main`; the earlier branch `wip/technical-seo-kenya-2026-11` is 100 commits ahead of main and contains unrelated changes, so it will not be merged or deployed.
- Audited the canonical domain, homepage metadata/schema, robots.txt, sitemap.xml, product/category generator, services generator/data, service hub, shipping page, service guide index and current navigation script.
- Updated `generate-products.mjs` in commit `875963bb9e9480a8b24a4f7bebf340d6d4a5aefa` so categories with fewer than five products get `noindex, follow`.
- Updated the category generator so `stermont-cars-for-sale` and `mens-fashion` are emitted at canonical root destinations `/cars-for-sale.html` and `/fashion.html`, with noindex redirect stubs at their old `/c/` URLs. The old paths are excluded from the generated category URL list; the destination paths are included.
- No changes have been merged to main or deployed. The live site remains untouched.

## Batch 1 — committed on review branch
- Updated `mobile-shell/shell.test.py` so the fixture intercepts the current `rpc/get_store_catalog` endpoint; the legacy products route remains available for product-detail requests.
- Updated `mobile-shell/app.js` homepage recommendation sorting to prioritize Pest Control, Agrovet, Home Appliances/Home & Kitchen, then Phones/Electronics, with featured listings first inside each department. This is a merchandising priority, not a claim about verified sales volume.
- Bumped the homepage mobile-shell cache URL from `?v=38` to `?v=39`; no CSS, navigation, cart, M-Pesa or WhatsApp implementation was changed.
- Updated `404.html` with a functional GET search form, links to key shop categories, and retained the original 404 fallback script, WhatsApp contact, page styling and noindex directive.
- Updated `generate-products.mjs` so the retired `/c/stermont-cars-for-sale.html` and `/c/mens-fashion.html` stubs redirect to the homepage with a canonical homepage URL and `noindex,follow`. Their root-level category pages remain available as separate destinations.
- Verified `CNAME` already contains exactly `stermontarcade.co.ke`; homepage canonical and OG URLs already use the primary domain.
- Verified `robots.txt` already allows crawlable assets, avoids blocking search/filter query URLs, disallows admin/account pages, and lists the primary, product, image, service and pest-control sitemaps. No change was necessary.
- Verified `sitemap.xml` and product/service/image sitemap generation are already handled by existing build scripts/workflows; no manual sitemap rewrite was made, to avoid overwriting automatically maintained product/blog/service URLs.
- No change was made to M-Pesa, cart, checkout, WhatsApp, CSS, navigation menus, CNAME or Supabase configuration.

## Batch 1 commits
- `e6f93167acb0db0f90353ba2671aff6080468f24` — fix mobile shell test fixture for catalogue RPC.
- `7e9560e7002246bb80a6fdc812b608cf620a9197` — improve branded 404 search and category recovery.
- `1a6738169ef1b50a1125fe85d1d96f79c1da741e` — prioritize key departments in homepage recommendations.
- `3b0953b78fe537c08cd87b177f2bffdd3c711b28` — refresh mobile shell script cache after recommendation update.
- `1ac428c072569de75424a2f4a9513e3d149a8ce3` — redirect retired legacy category URLs to homepage.

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

