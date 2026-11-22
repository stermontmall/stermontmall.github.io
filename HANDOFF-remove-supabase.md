# HANDOFF: remove Supabase (branch wip-remove-supabase)

Updated: 2026-11-23. Work is strictly sequential: complete Phase 1 removal and prove zero matches before beginning Phase 2 Neon integration. The deleted Supabase project is not to be restored. Never commit credentials.

## Owner requirements
- Phase 1: remove all Supabase code, references, generated artifacts, setup instructions, workflows, and Supabase-only client dependencies. Do not delete customer-facing capabilities that must be preserved for Phase 2.
- Phase 1 exit gate: executable repository code and generated customer-facing pages contain no Supabase URLs, SDKs, keys, or calls; docs and archived history may retain clearly labelled migration references only where necessary.
- Phase 2 only after Phase 1 passes: migrate the preserved storefront, account, admin, catalogue, order, review, chat, search, publishing, image and service capabilities to Neon Postgres and Neon services behind authenticated server APIs; never expose a Neon connection string in browser code.
- Owner confirmation on 2026-11-23 supersedes the earlier `no replacement` decision: preserve existing features and migrate their backend to Neon; do not silently retire features.
- Keep work on `wip-remove-supabase`; do not merge to main until build and CI pass.
- Preserve product-page build requirements: JSON-LD `priceCurrency: "KES"`, valid ISO-8601 `validFrom`, brand `Stermont Arcade`, and never create a `/blog/` folder.

## Completed deletions on this branch
- Previously deleted the `supabase/` directory and earlier root SQL files (per prior handoff history).
- Commit `d84b4a1d913cb436542d9e1c8c8248ef55b7b81e`: deleted `removed/daraja-20261112/` (six files) and `.github/workflows/keep-supabase-alive.yml`.
- Commit `5ee53016eff10a66bb2eb293b4bedc6ed5157fdc`: deleted remaining root Supabase setup SQL files: `setup-admin-extras.sql`, `setup-chat.sql`, `setup-client-quotations.sql`, `setup-search.sql`, and `setup-service-quotes.sql`.

## M-Pesa functions (owner asked to remove all, 2026-11-23)
- All M-Pesa function source is deleted on this branch: supabase/functions/{stk-push, stk-status, mpesa-mode, mpesa-callback, payments-in} and removed/daraja-20261112/*.
- Neon: no M-Pesa database functions and no deployed M-Pesa functions (only `photoupload` is deployed, not M-Pesa).
- Not touched: Neon tables mpesa_payments, mpesa_c2b_payments, payment_settings (tables, not functions), and M-Pesa references in client checkout code.
- Main still contains the old function files until this branch is merged.

## Branch-specific references confirmed so far

### Client scripts
`account-panel.js`, `catalog-v10.js`, `chat.js`, `checkout-handoff.js`, `kili-pages.js`, `mobile-shell/app.js`, `product-reviews.js`, `product-trust.js`, `recent-orders.js`, `search-log.js`, `shell-route-loader.js`, `site-links.js`, `storefront-live.js`, `sw.js`.

### Admin scripts
`admin-insights.js`, `admin-bulk.js`, `admin-extras.js`, `admin-quotations.js`, `admin-overview.js`, `admin-services.js`, `admin-service-media.js`, `admin-photo-ai.js`.

### Build scripts, generated HTML, docs, and workflows
Still being scanned on the branch. Do not treat GitHub code-search results against the default branch as a branch-specific inventory. Use the branch tree and branch blob contents for final verification.

## Work status
- Phase 1: IN PROGRESS. The file list above is confirmed, not yet an exhaustive inventory.
- Supabase code deletion from remaining client/admin/build files: not yet complete.
- Generated HTML and documentation cleanup: not yet complete.
- Repository-wide zero-match scan: NOT YET PASSED.
- Build and GitHub Actions: NOT YET VERIFIED.
- Neon project verified: `restless-shape-79120240`, default branch `br-fancy-bird-bh01xcbs` (`main`), region `aws-eu-central-1`.
- Neon currently has 93 categories, 3 orders, 3 reviews, 2 admin profiles, 0 products, 0 blog posts, and 0 service catalog rows. `product-photos` and `service-media` buckets exist; `photoupload` function is deployed.
- Archive contains 22 product backup rows (6 active; only 6 have images) and exported rows for orders (3), reviews (3), service quotes (1), stock restocks (16), and vouchers (1). Do not publish backup products until image URLs and product data are verified.
- Phase 2 Neon work: NOT STARTED; begin after Phase 1 exit gate passes.
