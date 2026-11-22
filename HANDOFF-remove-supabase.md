# HANDOFF: remove Supabase (branch wip-remove-supabase)

Decision (2026-11-23): remove ALL Supabase from the site, with no replacement, no backup, no archive, and no retained copies. The Supabase project was already permanently deleted by the owner. Work stays on this branch until the repository-wide scan is clean and build/CI pass. Do not merge to main before then.

## Completed before this work
- Branch created from main (37f141d).
- Deleted the Supabase source directory and SQL files previously recorded in the earlier handoff.
- Root SQL files previously recorded in the earlier handoff were removed.

## This cleanup commit
- Removed `removed/daraja-20261112/` and its six files (including the archived setup SQL).
- Removed `.github/workflows/keep-supabase-alive.yml`; it only existed to ping the deleted project.

## Remaining work — inventory and removal in progress
- Repo-wide branch-specific content scan for: `supabase`, `sb_publishable`, `oewvtbnmyombbtggamor`, `sb-*-auth-token`, `createClient`, `/functions/v1/`, and `/rest/v1/`.
- Remove remaining Supabase-only client code/features and delete files that have no independent purpose.
- Remove Supabase-dependent build/CI checks and workflow secrets/steps without adding replacements or stubs.
- Remove remaining Supabase setup SQL and Supabase-only archived/test artifacts.
- Remove Supabase references from generated HTML and documentation.
- Re-run repository-wide searches, build, and GitHub Actions. Record exact results here before any merge.

## Verification status
- Not yet verified: repo-wide zero-match search.
- Not yet verified: build or CI.
- Branch remains unmerged.
