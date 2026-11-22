# HANDOFF: photoupload bundling (branch wip-photoupload-bundle)

Date: 2026-11-22. Branched from feat/neon-photo-upload-2026-11-22 (PR #1045, draft). Not merged.

## Problem (verified live in Neon)
Function `photoupload` on project restless-shape-79120240, branch br-fancy-bird-bh01xcbs: deployment 3 status `failed`, error `deployed bundle failed to load: Cannot find package 'pg' imported from /opt/function/index.mjs`. The entrypoint was deployed without its npm dependencies.

## Done
- package.json: added `build` (esbuild bundles index.mjs plus pg, jose and @aws-sdk/client-s3 into dist/index.mjs, ESM, node24, pg-native external, require shim banner) and `deploy` (build, then `neon functions deploy photoupload --src dist`).
- .gitignore for node_modules and dist.
- .github/workflows/deploy-photoupload.yml: builds and deploys on push to this branch. Uses repo secret NEON_API_KEY (project-scoped key `github-photoupload`, added by the owner 2026-11-22). The CLI deploy line is a best guess and untested; on failure the job prints CLI help.
- Re-triggered the workflow after the secret was added (this commit).
- NOT run locally: no network or Neon CLI in the chat session.

## Left
1. Open the workflow run in GitHub Actions. If the deploy step fails, correct the neonctl command from the printed help.
2. `neon functions get photoupload` must show status ready (not failed). Then GET /health, and POST /upload with no token must return 401.
3. Signed-in test upload at /admin-photo-upload.html with one product code. Then check the object in the product-photos bucket and the product's images and admin_audit_log row in Neon.
4. Owner's Neon Auth user must be an active owner/admin/editor in public.admin_profiles (2 active admin profiles exist as of 2026-11-22).
5. Neon Auth trusted origins must include https://stermontarcade.co.ke.
6. Not started: generate-products.mjs still reads products from Supabase (Neon photos will not reach public pages until that is migrated). Do not publish the 22 Neon drafts, merge #1045 or activate products before then.
