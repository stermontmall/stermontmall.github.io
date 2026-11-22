# HANDOFF: remove Supabase (branch wip-remove-supabase)

Updated: 2026-11-23. Work is strictly sequential: complete Phase 1 removal and prove zero matches before beginning Phase 2 Neon integration. The deleted Supabase project is not to be restored. Never commit credentials.

## Owner requirements
- Phase 1: remove all Supabase code, references, generated artifacts, setup instructions, workflows, and Supabase-only features.
- Phase 1 exit gate: repository-wide search for `supabase`, `sb_publishable`, and `oewvtbnmyombbtggamor` returns zero matches.
- Phase 2 only after Phase 1 passes: use Neon Postgres behind a serverless API; never expose a Neon connection string in browser code.
- Keep work on `wip-remove-supabase`; do not merge to main until build and CI pass.
- Preserve product-page build requirements: JSON-LD `priceCurrency: "KES"`, valid ISO-8601 `validFrom`, brand `Stermont Arcade`, and never create a `/blog/` folder.

## Completed deletions on this branch
- Previously deleted the `supabase/` directory and earlier root SQL files (per prior handoff history).
- Commit `d84b4a1d913cb436542d9e1c8c8248ef55b7b81e`: deleted `removed/daraja-20261112/` (six files) and `.github/workflows/keep-supabase-alive.yml`.
- Commit `5ee53016eff10a66bb2eb293b4bedc6ed5157fdc`: deleted remaining root Supabase setup SQL files: `setup-admin-extras.sql`, `setup-chat.sql`, `setup-client-quotations.sql`, `setup-search.sql`, and `setup-service-quotes.sql`.

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
- Phase 2 Neon work: NOT STARTED; must not begin until Phase 1 exit gate passes.
