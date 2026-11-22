# Stermont Arcade — interim PocketBase backend

This is an isolated, reversible interim backend for the period when the Supabase Free project is returning HTTP 402 (exceed_cached_egress_quota). It is stored only in /pocketbase on branch wip-pocketbase-interim-backend. Nothing here deletes or edits Supabase data. No live storefront files are switched over by this work.

## Before you start

1. Create or open your PocketHost PocketBase instance and copy its HTTPS URL. Do not paste credentials into GitHub, a spreadsheet, or ChatGPT.
2. Confirm that the instance runs PocketBase v0.23 or later. The setup script uses the PocketBase collections API, _superusers authentication, fields arrays and /api/batch.
3. Export these CSV files from the Supabase dashboard into a private working folder on your computer: categories.csv, products.csv, vouchers.csv, and orders.csv. Keep the original exports unchanged as your backup.
4. Check that product price and old_price values are whole KES amounts ending in 00, 50, or 99. The importer rejects product prices outside that rule; it never rounds or silently edits them.
5. New photos stay in ImageKit (https://ik.imagekit.io/w6hxfnwmw/). This importer copies photo URL strings only; it does not upload photos or touch Supabase Storage.

## Step 1 — download the interim folder

Download or check out the wip-pocketbase-interim-backend branch. Keep the folder structure intact. Do not merge this branch into main as part of Phase 1.

## Step 2 — open a terminal in the repository

Use Node.js 20 or later. No npm packages are required.

    node --version

It should show v20 or newer.

## Step 3 — set PocketBase credentials privately

In macOS/Linux terminal:

    export PB_URL="https://YOUR-INSTANCE.pockethost.io"
    export PB_ADMIN_EMAIL="your-pocketbase-superuser-email"
    read -s PB_ADMIN_PASSWORD
    export PB_ADMIN_PASSWORD

In Windows PowerShell:

    $env:PB_URL = "https://YOUR-INSTANCE.pockethost.io"
    $env:PB_ADMIN_EMAIL = "your-pocketbase-superuser-email"
    $secure = Read-Host "PocketBase superuser password" -AsSecureString
    $env:PB_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

Replace the example URL and email on your own computer. Never commit a .env file containing real credentials. Clear the environment variables when finished.

## Step 4 — create the PocketBase collections

From the repository root, run:

    node pocketbase/setup.mjs

The script logs in as a PocketBase superuser, then creates or updates these collections:

- categories
- products
- product_costs (staff-only; wholesale cost is deliberately not on public product records)
- vouchers (staff-only)
- orders
- reviews
- product_slug_redirects
- users (PocketBase auth collection with role and legacy Supabase user ID mapping fields)

The setup is idempotent and does not delete collections or records. It preserves unrelated fields and indexes when updating a collection. Review the PocketBase dashboard after setup. If the API rejects a rule or field for your installed version, stop and share the exact error; do not weaken the rules to make setup pass.

## Step 5 — create staff accounts

1. Open the PocketBase admin dashboard.
2. Create each staff account in the users collection.
3. Set its role field to exactly staff.
4. Leave customer accounts as customer (or blank, which is treated as non-staff).
5. Do not give customers staff access. The API rules check the server-side role field.

Staff can read/write the protected collections. Public visitors can read active products, categories and slug redirects. Public users cannot read product_costs or vouchers.

## Step 6 — put the CSV files in the import folder

Put the four exports beside the repository's pocketbase folder, or run the importer from the folder containing the CSVs and pass their paths by changing the file names in the script. The default names are categories.csv, products.csv, vouchers.csv, and orders.csv.

The importer supports quoted commas, escaped quotes, multiline descriptions, PostgreSQL text[] values such as {"one","two"}, JSON/JSONB values, booleans and blank/null CSV cells.

## Step 7 — run the import

From the repository root:

    node pocketbase/import.mjs

To import only active products with at least one photo:

    node pocketbase/import.mjs --active-with-images

The importer:
- imports in groups of up to 50 using PocketBase /api/batch;
- falls back to individual requests if a batch fails;
- backs off and retries HTTP 429 responses;
- upserts by the original Supabase ID, so rerunning after a failure is safe;
- writes a local progress report to .pocketbase-import-state.json;
- moves product cost into staff-only product_costs records;
- keeps product IDs in supabase_id fields because PocketBase has its own short record IDs.

Keep the CSV exports and progress file private. Do not commit them.

### Customer order ownership and old accounts

Supabase Auth passwords and access tokens cannot be copied from a normal dashboard CSV export into PocketBase. Customers will need to register/sign in with PocketBase during the interim. Staff accounts are created manually.

For privacy, imported orders retain the old owner in supabase_user_id. The importer maps orders.user_id to a PocketBase user only when a matching users.supabase_user_id mapping exists; otherwise user_id is left blank. Those unmapped historic orders remain staff-visible, not customer-visible. A staff member can link an account safely after confirming the customer's identity. Do not bulk-guess account matches.

## Step 8 — test the CSV parser

Run:

    node pocketbase/csv.test.mjs

You should see:

    CSV parser tests passed.

This tests the CSV parser only. It does not test a live PocketBase instance or the shop.

## Step 9 — understand the site adapter (not activated yet)

adapter.js exposes window.STM_DB with a Supabase-js-like subset (from().select(), filters such as .eq()/.in(), .insert(), .update(), .delete(), .single(), and .auth). It also provides a compatibility window.supabase.createClient() bridge for gradual migration.

Before loading it on the live site, set window.STM_PB_URL to your PocketBase HTTPS URL and include adapter.js after any old Supabase SDK script but before the modules that use it. This branch deliberately does not edit those site files or enable the adapter.

The adapter is intentionally limited to Phase 1. It does not implement Supabase RPCs, Edge Functions, Realtime, Storage uploads, Supabase OAuth, or automatic payment callbacks. Product photos continue to use ImageKit. M-Pesa Paybill 714777 remains customer-entered/manual; Paystack remains manual in this phase. Automatic M-Pesa and Paystack flows are Phase 2.

### Site files to review for the later adapter cutover

The following current site/runtime files contain Supabase REST or client usage and should be migrated in a separate, reviewed change. The exact set must be re-grepped immediately before cutover because files change over time:

- storefront-live.js
- catalog-v10.js
- mobile-shell/app.js
- shell-route-loader.js
- index.html
- admin.html
- admin-bulk.js
- admin-extras.js
- admin-insights.js
- admin-quotations.js
- admin-overview.js
- admin-services.js
- admin-service-media.js
- admin-photo-ai.js
- admin-publishing-rules.js
- account.html
- account-panel.js
- checkout.html
- checkout-handoff.js
- checkout-deferred.js
- recent-orders.js
- product-reviews.js
- search-log.js
- chat.js
- advert-banner.js
- site-links.js
- product-trust.js
- services/updates.js
- kili-pages.js

Build-time scripts and server-side functions also use Supabase and need their own treatment; the browser adapter cannot replace those:

- generate-products.mjs
- data-health.mjs
- check-product-pages.mjs
- seo-catalog-guard.mjs
- product-watch.mjs
- price-watch.mjs
- stock-report.mjs
- sales-leads-report.mjs
- supabase/functions/* (including photo and payment functions)
- .github/workflows/uptime.yml and .github/workflows/keep-supabase-alive.yml

Do not mechanically replace all Supabase references. Build scripts, staff-only operations, SQL RPCs and Edge Functions need PocketBase-specific replacements or must remain paused until Supabase recovers. The files above are a review list, not an instruction to edit them in Phase 1.

## Step 10 — return to Supabase after its quota resets

1. Keep Supabase intact. This interim setup never deletes Supabase records, users, policies or files.
2. Export a fresh Supabase backup before switching back.
3. Reconcile orders, reviews, stock, vouchers and product changes made in PocketBase during the interim. Do not blindly overwrite newer Supabase records with an old CSV.
4. Resolve customer account mapping and duplicate/order conflicts before enabling Supabase again.
5. Switch the site configuration back to Supabase in a separate reviewed PR.
6. Keep PocketBase read-only for a short verification period, then decide separately whether to archive it.

## Security and operational cautions

- Never put PB_ADMIN_PASSWORD, a superuser token or any PocketBase superuser credential in browser JavaScript, GitHub, or a public environment variable.
- The browser must authenticate as a normal users record. Superuser authentication is only for the local setup/import scripts.
- product_costs and vouchers are staff-only. Do not copy cost into products.
- Orders may be created by guests, but client requests are blocked from setting status, pay_verified, handled_by, handled_at and stage.
- Customer order reads are scoped to their PocketBase user ID. Unmapped historical orders remain staff-only.
- Reviews can be created by a signed-in owner with status = pending; public reads are approved reviews plus the caller's own reviews.
- Public voucher validation is deliberately not implemented in Phase 1. Do not expose vouchers to the browser.
- PocketBase API rules are security boundaries; hiding admin controls in JavaScript is not a security measure.
- PocketHost rate limits vary. The importer limits batch calls to 50 records and retries 429 responses, but a full import can still take time.

## What has and has not been tested

Source definitions and parser test are committed, but the parser test has not been executed in this environment. Not tested against your PocketHost instance because no instance URL/credentials were provided and this environment cannot run your hosted PocketBase. The following remain mandatory before production cutover: run setup.mjs, inspect every rule in the admin UI, run a small test CSV import, verify public vs staff access using separate browser sessions, test customer order ownership, and confirm product pages/checkout end to end.

PocketBase is the temporary backend only. This branch does not switch the live shop, does not merge to main, and does not alter Supabase.
