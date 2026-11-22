# Backend migration handoff: Supabase to Neon

**Owner decision (2026-11-23):** Supabase has been deleted/disconnected. Preserve the existing storefront, catalogue, product publishing, admin, customer accounts, orders, reviews, quotations, services, search, photo upload, and payment capabilities by migrating their backend to Neon. Do not delete these customer-facing or admin capabilities as a shortcut.

## Repository state

- Repository: `stermontmall/stermontmall.github.io`
- Main branch includes merged PR #1048 (merge commit `74dfa11449eb9216aa42491e874e3bb65c24e9b9`).
- PR #1048 removed Supabase SQL and Supabase Edge Function source files. It did **not** complete the application migration.
- Work continues on `neon-migration-20261123`; do not merge this branch until the application has been migrated and tests/CI pass.
- Main currently contains legacy Supabase references in application code, generated pages, documentation, and archived files. A repository-wide inventory is still required.

## Recovery on the migration branch

- Restored `mobile-shell/app.js` from pre-deletion commit `458fc2fc59bfe5778ed6ca1a42ef67fee349cf67`; main had deleted it in commit `5ea1f6ae26ce8e117392620638200c215e0e5c55`.
- Restored `catalog-v10.js` from pre-deletion commit `4b5a7a24682d6bce03851a491088cdff9ecc9a78`; main had deleted it in commit `0f91885cc4629adade261a541c6e2cde246292fb`.
- These are source restorations on this migration branch only. They still contain Supabase calls and are not ready to deploy. Their purpose is to preserve the existing UI while replacing the backend.
- Main's `index.html` and `account.html` still contain Supabase URLs/SDK calls; `admin.html` still embeds the Supabase project URL/key. `generate-products.mjs` also has Supabase REST configuration.
- Main's index references the missing mobile-shell script and admin references the missing catalogue script; those missing-file references are now repaired on this migration branch by restoring the source files above.

## Verified Neon inventory (2026-11-23)

- Project: `restless-shape-79120240`
- Branch: `br-fancy-bird-bh01xcbs` (`main`)
- Database: `stermont`, region `aws-eu-central-1`
- Tables: 93 categories, 3 orders, 2 admin profiles, 0 products; reviews/archive records also exist in the exported archive.
- Storage buckets: `product-photos`, `service-media`.
- Deployed function: `photoupload` (deployment 5). Its end-to-end authenticated storefront/admin integration has not yet been verified.
- Neon Auth is enabled (Better Auth); trusted origin includes `https://stermontarcade.co.ke`; email/password auth is enabled but public sign-up is disabled.
- Both storage buckets currently contain zero objects (`product-photos`, `service-media`).
- Archived catalogue: 22 rows in `archive.products_backup_20261123`; 6 active, 6 with image URLs. Do not publish automatically; verify product details, images, prices, stock, and category before restoration.

## Migration requirements

1. Inventory every live Supabase reference in JS/HTML, generated `p/` pages, service/category pages, service worker caches, build scripts, tests, workflows, and docs. Separate executable references from historical notes.
2. Establish a single secure Neon-backed API contract. Browser code must never contain a Neon database URL, password, or privileged credential.
3. Implement and test public catalogue/product reads, admin authentication/roles, product CRUD, pricing rules, stock, photo upload and delivery, customer accounts, orders, reviews, quotations, service content, search/logging, and payment workflows as applicable to existing UI.
4. Use Neon Auth for identity and authorization; use server-side Neon Functions for privileged database/storage operations. Verify function authentication, CORS, input validation, and role enforcement.
5. Migrate archived data only after schema mapping and validation. Preserve product slugs/codes, order history, reviews, and other required records; never infer missing prices or product images.
6. Update build and SEO generation to consume a reliable Neon-backed export/API. Keep existing canonical product URLs, SEO metadata, sitemap entries, and mobile-shell routing rules.
7. Remove obsolete Supabase SDKs, URLs, keys, SQL references, and workflows only after each capability has a working Neon replacement. Keep historical migration notes clearly marked as historical.
8. Run unit tests, build, generated-page checks, security checks, and GitHub Actions. Verify the deployed site and admin flows before opening/merging a release PR.

## Known risks / blockers

- PR #1048 removed Supabase function and SQL source but the remaining app still contains Supabase references. Do not treat the PR as a complete migration.
- Product table in Neon is empty; archived product rows need review and restoration.
- Legacy product image URLs point to Supabase Storage and may no longer work. Rehost verified originals in Neon Storage or an approved image host; do not hotlink dead Supabase URLs.
- The existing `photoupload` Neon Function must be reviewed and tested before wiring it into admin.
- No M-Pesa Neon implementation has yet been verified. Payment flows must not be silently removed or marked successful without verified Safaricom callbacks.

## Current working rule

Make changes on `neon-migration-20261123`. Preserve main and all existing customer-facing functionality. Do not merge or deploy until the migration is complete and verified.
