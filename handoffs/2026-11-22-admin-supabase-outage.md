# Admin Supabase outage recovery — 2026-11-22

## Scope
This change hardens the existing admin console while Supabase returns HTTP 402 (`exceed_cached_egress_quota`). It does not restore Supabase, migrate the database, or make unavailable database operations work.

## Changes
- Added `admin-http.js` with shared HTTP-status classification, explicit refresh-token invalidation detection, and capped exponential back-off.
- Updated `admin.html` so a quota, permission, server, or network error during token refresh does not erase a locally stored admin session. A genuine HTTP 401 or explicit invalid refresh-token response still signs the administrator out.
- Updated login and order-load errors so HTTP 402 is not described as a password, staff-table, or setup.sql problem.
- Added a 30-second base retry back-off, doubling to a maximum five minutes after consecutive order-load failures. Both existing order polling timers pass through the same gate; the separate service badge poll is paused while the back-off is active.
- Manual order refresh remains available and can make an immediate retry.
- The initial service badge fetch now waits until the primary orders request succeeds, avoiding an extra immediate Supabase request during a known outage.
- Added isolated Node tests and a dedicated GitHub Actions workflow. These tests do not call Supabase and do not weaken the existing SEO checks.

## Validation
The dedicated workflow runs `node --test tests/admin-http.test.cjs` and syntax-checks the helper plus inline scripts in `admin.html`. Its result must be checked on the PR after GitHub Actions starts.

## Limitations
- The admin still cannot read orders or safely perform database writes while Supabase rejects requests with HTTP 402.
- No order is queued or reported saved offline.
- No Supabase data, RLS policy, storage configuration, billing setting, production secret, or customer record was changed.
- This is not a substitute for restoring Supabase service or validating the separate admin modules that make their own database requests.
